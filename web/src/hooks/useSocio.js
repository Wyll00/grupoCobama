import { useCallback, useSyncExternalStore } from 'react';

/**
 * La sesion del socio, que es su codigo de tarjeta guardado en el navegador.
 *
 * NO ES UNA CUENTA CON CONTRASENA, y conviene tenerlo claro antes de apoyarse
 * en esto para nada mas:
 *
 *   - Quien tenga el codigo ve el perfil. Por eso la API publica manda el
 *     nombre y las visitas pero NUNCA el telefono ni el correo: el codigo se
 *     ensena encima de una mesa y lo puede leer cualquiera que pase.
 *   - Lo unico que se puede hacer con el es MIRAR. Apuntar visitas y entregar
 *     premios va por el panel, con sesion de verdad.
 *
 * A cambio, el socio entra escribiendo ocho caracteres y no tiene que
 * inventarse una contrasena en la puerta de un restaurante, que es lo que hace
 * que nadie se registre. El dia que haga falta algo mas -cambiar sus datos,
 * darse de baja- hara falta un login de verdad, probablemente por SMS.
 *
 * Se guarda en el navegador para que la segunda visita entre directa: eso es
 * lo que hace que parezca una cuenta.
 *
 * --- por que un almacen y no un useState ---
 *
 * Esto empezo siendo un `useState` por componente, y con un solo componente
 * leyendolo funcionaba. En cuanto hubo dos -el boton de la cabecera y el
 * propio perfil- se vio el fallo: al entrar, el perfil guardaba el codigo y
 * se repintaba el, pero el boton de la cabecera seguia rotulado "Tarjeta de
 * socio" hasta que alguien recargaba la pagina. Cada copia del hook tenia su
 * estado y ninguna se enteraba de las demas.
 *
 * El evento `storage` del navegador no lo arregla: solo salta en las OTRAS
 * pestanas, nunca en la que escribe. Asi que el codigo vive en el modulo, los
 * componentes se suscriben, y quien escribe avisa a todos. `storage` se sigue
 * escuchando, pero para lo suyo: que al salir por una pestana se enteren las
 * demas.
 */

const CLAVE = 'cobama:socio';

const normalizar = (c) => String(c ?? '').trim().toUpperCase();

export function codigoGuardado() {
  try {
    return localStorage.getItem(CLAVE) || null;
  } catch {
    // Navegador con el almacenamiento bloqueado -modo privado-. No es un
    // error: simplemente habra que escribir el codigo cada vez.
    return null;
  }
}

/*
  El valor vivo, aparte del almacenamiento.

  Hace falta porque `useSyncExternalStore` compara la foto anterior con la
  nueva por identidad, y con el almacenamiento capado -donde `codigoGuardado`
  siempre devuelve null- hay que poder recordar igual el codigo de la visita.
  Con cadenas la comparacion es por valor, asi que no hay repintados de mas.
*/
let codigoVivo = codigoGuardado();
const oyentes = new Set();

function avisar() {
  for (const oyente of oyentes) oyente();
}

function suscribir(oyente) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

// Una sola escucha para todo el modulo, no una por componente.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== CLAVE) return;
    codigoVivo = e.newValue || null;
    avisar();
  });
}

const foto = () => codigoVivo;

export function entrarComoSocio(nuevo) {
  const limpio = normalizar(nuevo);
  if (!limpio || limpio === codigoVivo) return;
  try {
    localStorage.setItem(CLAVE, limpio);
  } catch {
    // Sin almacenamiento, la sesion dura lo que la visita.
  }
  codigoVivo = limpio;
  avisar();
}

export function salirDeSocio() {
  if (codigoVivo === null) return;
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que limpiar.
  }
  codigoVivo = null;
  avisar();
}

export function useSocio() {
  const codigo = useSyncExternalStore(suscribir, foto, () => null);

  // Estables a proposito: `entrar` va en las dependencias de un efecto en
  // `Socio.jsx`, y si cambiara en cada pintado el efecto se repetiria solo.
  const entrar = useCallback((nuevo) => entrarComoSocio(nuevo), []);
  const salir = useCallback(() => salirDeSocio(), []);

  return { codigo, entrar, salir };
}
