/*
  El service worker. Hace dos cosas, y la segunda es la que de verdad importa.

  1) Sin el, ANDROID NO DEJA INSTALAR. Chrome no ofrece "anadir a pantalla de
     inicio" a una web que no tenga uno, por mucho manifiesto que lleve.
     Comprobado: sin esto el evento `beforeinstallprompt` no salta nunca y el
     boton de guardar la tarjeta no llega a aparecer.

  2) La tarjeta se abre SIN COBERTURA. Un guachinche con paredes de piedra en
     medio de La Orotava no tiene por que tener linea, y una tarjeta de socio
     que no se puede ensenar porque no carga no sirve de nada. Con esto, la
     ultima version de la tarjeta se queda guardada y se ensena igual.

  ---------------------------------------------------------------------------
  DE RED PRIMERO, CASI PARA TODO. Esto no es un detalle: es la leccion de la
  vez que esta web se quedo un ano sirviendo un icono viejo porque se cachearon
  ficheros sin huella. Un service worker mal hecho hace lo mismo pero peor,
  porque sobrevive a recargar la pagina.

  Asi que:
    - Lo de /assets/ lleva huella en el nombre -index-A1b2C3.js-, cambia de
      nombre en cada compilacion y por eso SI se puede servir de cache sin
      riesgo: un fichero viejo nunca puede hacerse pasar por el nuevo.
    - Todo lo demas -el HTML, la API, las imagenes sueltas- va a la red
      primero. La cache solo entra cuando la red falla. Lo peor que puede
      pasar entonces es ensenar datos de ayer sin conexion, que es exactamente
      lo que se quiere.
  ---------------------------------------------------------------------------
*/

// Al subir este numero se tiran las caches viejas. Hay que tocarlo cuando
// cambie la ESTRATEGIA de aqui; para el contenido no hace falta, porque nada
// que no lleve huella se sirve de cache estando la red.
const VERSION = 'v3';
const CACHE = `cobama-${VERSION}`;

// Lo minimo para que la tarjeta abra sin red. No se precachean los assets
// porque sus nombres cambian en cada compilacion: se van guardando solos segun
// se piden.
// El manifiesto de la tarjeta ya no es un fichero fijo: lo sirve la API, uno
// por socio, y precachear el de alguien en concreto no tiene sentido.
const BASICOS = ['/', '/socio', '/manifest.webmanifest', '/icono/icono-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      // `addAll` falla entero si falla UNA, y entonces no se instala nada.
      // Una a una: lo que se pueda guardar, se guarda.
      .then((c) => Promise.allSettled(BASICOS.map((u) => c.add(u))))
      // Sin esto, la version nueva se queda esperando a que se cierren todas
      // las pestanas. En un movil eso puede ser nunca.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Solo GET y solo lo de esta casa. Un POST -darse de alta, apuntar una
  // visita- no se cachea ni se reintenta jamas: repetirlo sin querer crearia
  // socios duplicados.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Lo del panel no se toca. Son datos de gestion con sesion detras, y una
  // respuesta suya guardada en el movil de alguien no pinta nada.
  if (url.pathname.startsWith('/api/admin')) return;

  // Con huella en el nombre: de cache primero, que es lo que hace que abra
  // rapido y sin red.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(req).then(
        (guardado) =>
          guardado ??
          fetch(req).then((res) => {
            if (res.ok) {
              const copia = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copia));
            }
            return res;
          })
      )
    );
    return;
  }

  // Todo lo demas: la red manda, la cache es el paracaidas.
  e.respondWith(
    fetch(req)
      .then(async (res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        }

        /*
          El servidor contesto, pero mal. Y eso NO es lo mismo que no haber
          red, asi que hay que distinguir:

            5xx  el servidor esta roto o caido detras de un proxy. Si hay una
                 copia guardada, vale mas la tarjeta de ayer que un error:
                 quien esta en la puerta del local necesita ensenar algo.
            4xx  es una respuesta de verdad sobre ESTA peticion -"esa tarjeta
                 no existe", "no tienes permiso"- y hay que dejarla pasar.
                 Tapandola con una copia vieja se le ensenaria a alguien una
                 tarjeta que ya no esta.

          Esto hacia falta porque un `fetch` que recibe un 500 se resuelve, no
          se rechaza: sin este tramo, el `catch` de abajo no llegaba a correr y
          la copia guardada no se usaba nunca con el servidor caido. Probado
          parando la API: la pagina abria pero la tarjeta salia en blanco.
        */
        if (res.status >= 500) {
          const guardado = await caches.match(req);
          if (guardado) return guardado;
        }

        return res;
      })
      .catch(async () => {
        const guardado = await caches.match(req);
        if (guardado) return guardado;

        // Una direccion que nunca se visito y no hay red: se devuelve el
        // esqueleto de la web, que al menos pinta la cabecera y el aviso en
        // vez de la pantalla de dinosaurio del navegador.
        if (req.mode === 'navigate') {
          const raiz = await caches.match('/');
          if (raiz) return raiz;
        }

        return Response.error();
      })
  );
});
