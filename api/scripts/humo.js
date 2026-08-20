/**
 * Prueba de humo del panel de administracion.
 *
 *   npm run humo --prefix api
 *
 * Conviene lanzarla contra una API arrancada con `npm start`, no con
 * `npm run dev`: el --watch de este ultimo reinicia el servidor si algo toca
 * un fichero durante la ejecucion y la prueba muere con ECONNRESET.
 *
 * No se puede lanzar mas de seis veces en quince minutos: cada ejecucion hace
 * un login fallido a proposito y acaba topando con el limitador de intentos.
 * El limitador vive en memoria, asi que reiniciar la API lo pone a cero.
 *
 * Recorre el flujo completo contra una API ya levantada: login, rotacion de
 * refresco, limites por rol y por local, CRUD de catalogo, carta e historico
 * de precios. No sustituye a una bateria de tests, pero detecta al momento si
 * algo del panel se ha roto.
 *
 * Deja la base de datos como estaba: lo que crea, lo revierte al final.
 */
const BASE = process.env.API_URL ?? 'http://localhost:4100';
const PASSWORD = 'cobama2026';

let fallos = 0;
let pruebas = 0;

/**
 * Lo que la prueba va creando. Se limpia en un finally: si la prueba se rompe
 * a mitad, los datos sinteticos no pueden quedarse en la base de datos.
 */
const rastro = {
  platoId: null,
  itemId: null,
  usuarioId: null,
  platoNuevoId: null,
  categoriaId: null,
  ocupacionTramo: null,
  reservaId: null,
  reservaCodigo: null,
  platoEncargadoId: null,
  portadaLocal: null,
};

function comprobar(descripcion, condicion, detalle) {
  pruebas++;
  if (condicion) {
    console.log(`  ok    ${descripcion}`);
  } else {
    fallos++;
    console.log(`  FALLO ${descripcion}${detalle ? `\n        ${detalle}` : ''}`);
  }
}

function seccion(titulo) {
  console.log(`\n${titulo}`);
}

/** Cliente minimo con cookie de sesion y access token. */
function crearCliente() {
  const cliente = { acceso: null, cookie: null, usuario: null };

  cliente.peticion = async (metodo, ruta, cuerpo) => {
    const cabeceras = {};
    if (cliente.acceso) cabeceras.authorization = `Bearer ${cliente.acceso}`;
    if (cliente.cookie) cabeceras.cookie = cliente.cookie;
    if (cuerpo !== undefined) cabeceras['content-type'] = 'application/json';

    const res = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });

    const setCookie = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookie) {
      if (c.startsWith('cobama_refresh=')) cliente.cookie = c.split(';')[0];
    }

    const texto = await res.text();
    let json = null;
    try {
      json = texto ? JSON.parse(texto) : null;
    } catch {
      json = { crudo: texto.slice(0, 200) };
    }

    return { status: res.status, cuerpo: json };
  };

  cliente.login = async (email, password = PASSWORD) => {
    const res = await cliente.peticion('POST', '/api/auth/login', { email, password });
    if (res.status !== 200) {
      throw new Error(`login de ${email} fallo: ${res.status} ${JSON.stringify(res.cuerpo)}`);
    }
    cliente.acceso = res.cuerpo.datos.acceso;
    cliente.usuario = res.cuerpo.datos.usuario;
    return res;
  };

  return cliente;
}

async function main() {
  const salud = await fetch(`${BASE}/api/health`).catch(() => null);
  if (!salud?.ok) {
    console.error(`No responde la API en ${BASE}. Levantala con: npm run dev --prefix api`);
    process.exit(1);
  }

  // ---------------------------------------------------------------- login
  seccion('Autenticacion');

  const anonimo = crearCliente();
  const sinToken = await anonimo.peticion('GET', '/api/admin/platos');
  comprobar('sin token, /api/admin devuelve 401', sinToken.status === 401);

  const conBasura = crearCliente();
  conBasura.acceso = 'esto.no.es.un.jwt';
  const basura = await conBasura.peticion('GET', '/api/admin/platos');
  comprobar('con token invalido devuelve 401', basura.status === 401);

  const malPassword = await crearCliente().peticion('POST', '/api/auth/login', {
    email: 'admin@grupocobama.es',
    password: 'incorrecta',
  });
  comprobar('contrasena incorrecta devuelve 401', malPassword.status === 401);

  const admin = crearCliente();
  await admin.login('admin@grupocobama.es');
  comprobar('login de admin_grupo', admin.usuario.rol === 'admin_grupo');
  comprobar('admin_grupo no tiene local asignado', admin.usuario.restaurante_id === null);

  const basilica = crearCliente();
  await basilica.login('labasilica@grupocobama.es');
  comprobar('login de encargado_local', basilica.usuario.rol === 'encargado_local');
  comprobar('encargado ligado a La Basilica (2)', basilica.usuario.restaurante_id === 2);

  // ----------------------------------------------------- rotacion de token
  seccion('Rotacion del refresh token');

  const cookieOriginal = basilica.cookie;
  const refresco1 = await basilica.peticion('POST', '/api/auth/refresh');
  comprobar('el refresco devuelve un access token nuevo', refresco1.status === 200);
  comprobar('la cookie rota tras el refresco', basilica.cookie !== cookieOriginal);

  // Dentro del margen de gracia, reutilizar el token anterior se entiende como
  // carrera entre dos pestanas, no como robo.
  const carrera = crearCliente();
  carrera.cookie = cookieOriginal;
  const enCarrera = await carrera.peticion('POST', '/api/auth/refresh');
  comprobar(
    'reutilizar el token recien rotado se acepta como carrera (200)',
    enCarrera.status === 200,
    `llego ${enCarrera.status}`
  );
  comprobar(
    'en una carrera NO se vuelve a rotar la cookie',
    carrera.cookie === cookieOriginal
  );

  const sigueViva = await basilica.peticion('POST', '/api/auth/refresh');
  comprobar('la sesion legitima sigue viva tras la carrera', sigueViva.status === 200);

  // Pasado el margen si es robo. Se simula envejeciendo la revocacion en la
  // base de datos en vez de esperar diez segundos.
  const { pool: bd } = await import('../src/config/db.js');
  const { createHash } = await import('node:crypto');
  const hashViejo = createHash('sha256')
    .update(cookieOriginal.split('=')[1])
    .digest('hex');
  await bd.execute(
    "UPDATE refresh_tokens SET revocado_en = NOW() - INTERVAL 60 SECOND WHERE token_hash = ?",
    [hashViejo]
  );

  const ladron = crearCliente();
  ladron.cookie = cookieOriginal;
  const robado = await ladron.peticion('POST', '/api/auth/refresh');
  comprobar('reutilizar un token viejo se rechaza (401)', robado.status === 401);

  const trasRobo = await basilica.peticion('POST', '/api/auth/refresh');
  comprobar(
    'detectado el robo, se revoca toda la familia de sesiones',
    trasRobo.status === 401,
    `se esperaba 401 y llego ${trasRobo.status}`
  );

  // La sesion legitima se vuelve a abrir para el resto de la prueba.
  await basilica.login('labasilica@grupocobama.es');

  // ------------------------------------------------- limites por rol/local
  seccion('Limites por rol y por local');

  const ajena = await basilica.peticion('GET', '/api/admin/restaurantes/1/carta');
  comprobar('un encargado no entra en la carta de otro local (403)', ajena.status === 403);

  const propia = await basilica.peticion('GET', '/api/admin/restaurantes/2/carta');
  comprobar('un encargado si entra en la suya (200)', propia.status === 200);

  const crearPlatoComoEncargado = await basilica.peticion('POST', '/api/admin/platos', {
    categoria_id: 1,
    nombre: 'Intento no autorizado',
  });
  comprobar(
    'un encargado no crea platos en el catalogo maestro (403)',
    crearPlatoComoEncargado.status === 403
  );

  const usuariosComoEncargado = await basilica.peticion('GET', '/api/admin/usuarios');
  comprobar('un encargado no lista usuarios (403)', usuariosComoEncargado.status === 403);

  const listaPlatos = await basilica.peticion('GET', '/api/admin/platos');
  comprobar('un encargado si LEE el catalogo maestro (200)', listaPlatos.status === 200);

  // ------------------------------------------------------------- catalogo
  seccion('Catalogo maestro');

  const nombrePrueba = `Plato de prueba ${Date.now()}`;
  const creado = await admin.peticion('POST', '/api/admin/platos', {
    categoria_id: 1,
    nombre: nombrePrueba,
    descripcion: 'Creado por la prueba de humo.',
    es_vegetariano: true,
    alergenos: [1, 7],
  });
  comprobar('admin crea un plato (201)', creado.status === 201);
  const platoId = creado.cuerpo?.datos?.id;
  rastro.platoId = platoId;
  comprobar('el plato guarda sus alergenos', creado.cuerpo?.datos?.alergenos?.length === 2);

  const invalido = await admin.peticion('POST', '/api/admin/platos', {
    categoria_id: 1,
    nombre: 'x',
  });
  comprobar('un nombre demasiado corto devuelve 400', invalido.status === 400);
  comprobar(
    'el 400 explica que campo falla',
    invalido.cuerpo?.error?.detalles?.[0]?.campo === 'nombre',
    JSON.stringify(invalido.cuerpo?.error?.detalles)
  );

  const editado = await admin.peticion('PATCH', `/api/admin/platos/${platoId}`, {
    descripcion: 'Descripcion cambiada.',
    alergenos: [3],
  });
  comprobar('admin edita el plato', editado.cuerpo?.datos?.descripcion === 'Descripcion cambiada.');
  comprobar('los alergenos se sustituyen, no se acumulan', editado.cuerpo?.datos?.alergenos?.length === 1);

  // ------------------------------------------------- revision de alergenos
  seccion('Confirmar alergenos');

  comprobar(
    'un plato nace con los alergenos sin confirmar',
    editado.cuerpo?.datos?.alergenos_revisados_en === null,
    String(editado.cuerpo?.datos?.alergenos_revisados_en)
  );

  const confirmado = await admin.peticion('POST', `/api/admin/platos/${platoId}/confirmar-alergenos`);
  comprobar('confirmar responde 200', confirmado.status === 200);
  comprobar(
    'queda la fecha de confirmacion',
    Boolean(confirmado.cuerpo?.datos?.alergenos_revisados_en)
  );
  comprobar(
    'queda quien lo confirmo',
    Boolean(confirmado.cuerpo?.datos?.alergenos_revisados_por)
  );

  // Lo importante de todo esto: la firma vale para una lista concreta de
  // alergenos, no para el plato. Si la lista cambia, la firma ya no dice
  // nada y tiene que caerse sola.
  const trasCambiar = await admin.peticion('PATCH', `/api/admin/platos/${platoId}`, {
    alergenos: [3, 7],
  });
  comprobar(
    'cambiar los alergenos invalida la confirmacion',
    trasCambiar.cuerpo?.datos?.alergenos_revisados_en === null,
    String(trasCambiar.cuerpo?.datos?.alergenos_revisados_en)
  );

  const cambioSinAlergenos = await admin.peticion('POST', `/api/admin/platos/${platoId}/confirmar-alergenos`);
  comprobar('vuelve a confirmarse', Boolean(cambioSinAlergenos.cuerpo?.datos?.alergenos_revisados_en));
  const soloNombre = await admin.peticion('PATCH', `/api/admin/platos/${platoId}`, {
    descripcion: 'Solo cambia la descripcion.',
  });
  comprobar(
    'tocar otro campo NO invalida la confirmacion',
    Boolean(soloNombre.cuerpo?.datos?.alergenos_revisados_en)
  );

  // -------------------------------------------------------------- imagenes
  seccion('Imagenes de plato');

  const sharp = (await import('sharp')).default;

  // Imagen sintetica en vertical, para comprobar de paso que el recorte 4:3
  // se aplica y no se limita a reescalar.
  const jpeg = await sharp({
    create: {
      width: 900,
      height: 1200,
      channels: 3,
      background: { r: 200, g: 120, b: 40 },
    },
  })
    .jpeg()
    .toBuffer();

  const formulario = new FormData();
  formulario.append('imagen', new Blob([jpeg], { type: 'image/jpeg' }), 'prueba.jpg');
  formulario.append('x', '100');
  formulario.append('y', '200');
  formulario.append('ancho', '800');
  formulario.append('alto', '600');

  const subida = await fetch(`${BASE}/api/admin/platos/${platoId}/imagen`, {
    method: 'POST',
    headers: { authorization: `Bearer ${admin.acceso}` },
    body: formulario,
  });
  const subidaJson = await subida.json().catch(() => null);

  comprobar('admin sube una imagen (200)', subida.status === 200, `llego ${subida.status}`);
  comprobar(
    'se guardan las dos rutas, grande y miniatura',
    Boolean(subidaJson?.datos?.imagen && subidaJson?.datos?.imagen_thumb)
  );
  comprobar(
    'la imagen se convierte a webp',
    subidaJson?.datos?.imagen?.endsWith('.webp') === true
  );

  if (subidaJson?.datos?.imagen) {
    const descargada = await fetch(`${BASE}${subidaJson.datos.imagen}`);
    const metadatos = await sharp(Buffer.from(await descargada.arrayBuffer())).metadata();
    comprobar(
      'la grande sale en 1200x900',
      metadatos.width === 1200 && metadatos.height === 900,
      `${metadatos.width}x${metadatos.height}`
    );
    comprobar('se sirve como webp', metadatos.format === 'webp');
  }

  const recorteFuera = new FormData();
  recorteFuera.append('imagen', new Blob([jpeg], { type: 'image/jpeg' }), 'prueba.jpg');
  recorteFuera.append('x', '0');
  recorteFuera.append('y', '0');
  recorteFuera.append('ancho', '5000');
  recorteFuera.append('alto', '5000');

  const fuera = await fetch(`${BASE}/api/admin/platos/${platoId}/imagen`, {
    method: 'POST',
    headers: { authorization: `Bearer ${admin.acceso}` },
    body: recorteFuera,
  });
  comprobar('un recorte que se sale de la imagen se rechaza (400)', fuera.status === 400);

  const noEsImagen = new FormData();
  noEsImagen.append('imagen', new Blob(['esto no es una imagen'], { type: 'text/plain' }), 'x.txt');
  const rechazado = await fetch(`${BASE}/api/admin/platos/${platoId}/imagen`, {
    method: 'POST',
    headers: { authorization: `Bearer ${admin.acceso}` },
    body: noEsImagen,
  });
  comprobar('un fichero que no es imagen se rechaza (400)', rechazado.status === 400);


  // ------------------------------------------------------ carta del local
  seccion('Carta por local');

  const anadido = await basilica.peticion('POST', '/api/admin/restaurantes/2/carta', {
    plato_id: platoId,
    precio: 9.5,
  });
  comprobar('el encargado anade el plato a su carta (201)', anadido.status === 201);
  const itemId = anadido.cuerpo?.datos?.id;
  rastro.itemId = itemId;

  const duplicado = await basilica.peticion('POST', '/api/admin/restaurantes/2/carta', {
    plato_id: platoId,
    precio: 9.5,
  });
  comprobar('no se puede anadir dos veces el mismo plato (409)', duplicado.status === 409);

  const enOtroLocal = await basilica.peticion('POST', '/api/admin/restaurantes/4/carta', {
    plato_id: platoId,
    precio: 9.5,
  });
  comprobar('el encargado no anade platos a otro local (403)', enOtroLocal.status === 403);

  // ------------------------------------------------- ver en la mesa (AR)
  seccion('Ver el plato en la mesa');

  const sinMedida = await fetch(`${BASE}/api/platos/${platoId}/ar`).then((r) => r.json());
  comprobar(
    'sin medida, la vista no se ofrece',
    sinMedida.datos?.disponible === false && sinMedida.datos?.falta === 'medida',
    JSON.stringify(sinMedida.datos)
  );

  await admin.peticion('PATCH', `/api/admin/platos/${platoId}`, { ancho_cm: 26 });

  const conMedida = await fetch(`${BASE}/api/platos/${platoId}/ar`).then((r) => r.json());
  comprobar('con foto y medida, ya se ofrece', conMedida.datos?.disponible === true);
  comprobar(
    'el modelo se genera desde la foto',
    conMedida.datos?.modo === 'foto',
    conMedida.datos?.modo
  );
  comprobar('devuelve la ruta del glb', conMedida.datos?.glb?.endsWith('.glb') === true);

  const modelo = await fetch(`${BASE}${conMedida.datos.glb}`);
  const glbBytes = Buffer.from(await modelo.arrayBuffer());
  comprobar('el glb se sirve (200)', modelo.status === 200);
  comprobar('y es un glTF binario de verdad', glbBytes.readUInt32LE(0) === 0x46546c67);

  // El modelo tiene que llegar a la escala que se pidio: es justo el dato que
  // hace util la funcion, y un fallo aqui no se ve, solo sale un plato de
  // tamano equivocado en la mesa del cliente.
  const largoJsonGlb = glbBytes.readUInt32LE(12);
  const jsonGlb = JSON.parse(glbBytes.subarray(20, 20 + largoJsonGlb).toString('utf8'));
  const anchoModeloCm = (jsonGlb.accessors[0].max[0] - jsonGlb.accessors[0].min[0]) * 100;
  comprobar(
    'el modelo mide los 26 cm que se indicaron',
    Math.abs(anchoModeloCm - 26) < 0.05,
    `${anchoModeloCm.toFixed(2)} cm`
  );

  const segundaVez = await fetch(`${BASE}/api/platos/${platoId}/ar`).then((r) => r.json());
  comprobar(
    'la segunda vez sirve el mismo fichero cacheado',
    segundaVez.datos.glb === conMedida.datos.glb
  );

  const medidaAbsurda = await admin.peticion('PATCH', `/api/admin/platos/${platoId}`, {
    ancho_cm: 250,
  });
  comprobar('una medida imposible se rechaza (400)', medidaAbsurda.status === 400);

  const enCartaPublica = await fetch(`${BASE}/api/restaurantes/la-basilica/carta`).then((r) =>
    r.json()
  );
  const platoEnCarta = enCartaPublica.datos.categorias
    .flatMap((c) => c.platos)
    .find((p) => p.id === platoId);
  comprobar(
    'la carta publica marca el plato como visible en la mesa',
    platoEnCarta?.ver_en_mesa === true
  );

  await admin.peticion('PATCH', `/api/admin/platos/${platoId}`, { ancho_cm: null });


  const borrada = await admin.peticion('DELETE', `/api/admin/platos/${platoId}/imagen`);
  comprobar('se puede quitar la imagen', borrada.cuerpo?.datos?.imagen === null);

  // ------------------------------------------- crear plato desde la carta
  seccion('Crear un plato nuevo desde la carta');

  const nombreDirecto = `Plato directo ${Date.now()}`;
  const directo = await admin.peticion('POST', '/api/admin/restaurantes/4/carta/nuevo-plato', {
    categoria_id: 1,
    nombre: nombreDirecto,
    descripcion: 'Creado desde la carta de El Descarado.',
    precio: 13.4,
    destacado: true,
    alergenos: [1, 4],
  });
  comprobar('admin crea plato y lo mete en la carta de una vez (201)', directo.status === 201);
  rastro.platoNuevoId = directo.cuerpo?.datos?.plato_id;
  comprobar('la linea sale con su precio', Number(directo.cuerpo?.datos?.precio) === 13.4);
  comprobar('y marcada como destacada', directo.cuerpo?.datos?.destacado === true);

  const fichaDirecta = await admin.peticion('GET', `/api/admin/platos/${rastro.platoNuevoId}`);
  comprobar(
    'el plato queda en el catalogo del grupo',
    fichaDirecta.cuerpo?.datos?.nombre === nombreDirecto
  );
  comprobar('con sus alergenos', fichaDirecta.cuerpo?.datos?.alergenos?.length === 2);
  comprobar(
    'y solo en la carta del local donde se creo',
    fichaDirecta.cuerpo?.datos?.en_cartas?.length === 1 &&
      fichaDirecta.cuerpo.datos.en_cartas[0].restaurante_id === 4
  );

  // Un encargado SI puede dar de alta un plato desde su carta: es lo que pasa
  // cuando entra un plato nuevo en su cocina.
  const nombreEncargado = `Plato del encargado ${Date.now()}`;
  const platoEncargado = await basilica.peticion(
    'POST',
    '/api/admin/restaurantes/2/carta/nuevo-plato',
    { categoria_id: 1, nombre: nombreEncargado, precio: 8.5 }
  );
  comprobar('un encargado crea un plato desde su carta (201)', platoEncargado.status === 201);
  rastro.platoEncargadoId = platoEncargado.cuerpo?.datos?.plato_id;

  const fichaEncargado = await basilica.peticion(
    'GET',
    `/api/admin/platos/${rastro.platoEncargadoId}`
  );
  comprobar(
    'y nace sirviendolo solo su local',
    fichaEncargado.cuerpo?.datos?.locales === 1 &&
      fichaEncargado.cuerpo?.datos?.unico_restaurante_id === 2
  );

  const editaElSuyo = await basilica.peticion(
    'PATCH',
    `/api/admin/platos/${rastro.platoEncargadoId}`,
    { descripcion: 'Corregido por el encargado' }
  );
  comprobar('puede editar el plato que solo sirve el (200)', editaElSuyo.status === 200);

  // En cuanto otra casa lo pone en carta, deja de ser suyo.
  await admin.peticion('POST', '/api/admin/restaurantes/4/carta', {
    plato_id: rastro.platoEncargadoId,
    precio: 9,
  });
  const yaCompartido = await basilica.peticion(
    'PATCH',
    `/api/admin/platos/${rastro.platoEncargadoId}`,
    { nombre: 'Intento de renombrar algo compartido' }
  );
  comprobar(
    'cuando lo sirve otra casa, ya no puede renombrarlo (403)',
    yaCompartido.status === 403,
    `llego ${yaCompartido.status}`
  );

  // El plato 1 (papas arrugadas) esta en las cuatro cartas: es del grupo.
  const compartidoPorTodos = await basilica.peticion('PATCH', '/api/admin/platos/1', {
    descripcion: 'No deberia poder',
  });
  comprobar(
    'no puede editar un plato que sirven varias casas (403)',
    compartidoPorTodos.status === 403,
    compartidoPorTodos.cuerpo?.error?.mensaje
  );

  // El plato 9 (almogrote) solo lo sirve La Casa del Mago: es de esa casa.
  const deOtraCasa = await basilica.peticion('PATCH', '/api/admin/platos/9', {
    descripcion: 'No deberia poder',
  });
  comprobar(
    'ni uno que solo sirve otra casa (403)',
    deOtraCasa.status === 403,
    deOtraCasa.cuerpo?.error?.mensaje
  );

  // Pero el que solo esta en su carta, si: aunque lo creara el admin.
  const soloSuyo = await basilica.peticion('PATCH', `/api/admin/platos/${platoId}`, {
    descripcion: 'Ajustado por el encargado',
  });
  comprobar(
    'y si edita cualquiera que solo este en su carta (200)',
    soloSuyo.status === 200,
    `llego ${soloSuyo.status}`
  );

  const sinPrecio = await admin.peticion('POST', '/api/admin/restaurantes/4/carta/nuevo-plato', {
    categoria_id: 1,
    nombre: 'Sin precio ninguno',
  });
  comprobar('crear sin precio se rechaza (400)', sinPrecio.status === 400);

  // -------------------------------------------------- portada del local
  seccion('Foto de portada del local');

  const portadaJpeg = await sharp({
    create: { width: 2400, height: 1400, channels: 3, background: { r: 90, g: 70, b: 55 } },
  })
    .jpeg()
    .toBuffer();

  // Subir una portada BORRA la anterior, tambien el fichero del disco. Si La
  // Basilica ya tiene la suya puesta, la parte de subida se salta: una prueba
  // no puede llevarse por delante una foto de verdad.
  const yaTiene = (await fetch(`${BASE}/api/restaurantes/la-basilica`).then((r) => r.json()))
    .datos?.imagen_portada;

  if (yaTiene) {
    console.log('  --    La Basilica ya tiene portada, no se toca (se salta la subida)');
  }

  const formPortada = new FormData();
  formPortada.append('imagen', new Blob([portadaJpeg], { type: 'image/jpeg' }), 'portada.jpg');

  const subidaPortada = yaTiene ? null : await fetch(`${BASE}/api/admin/restaurantes/2/portada`, {
    method: 'POST',
    headers: { authorization: `Bearer ${basilica.acceso}` },
    body: formPortada,
  });
  const portadaJson = subidaPortada ? await subidaPortada.json().catch(() => null) : null;

  if (subidaPortada) {
    comprobar('el encargado sube la portada de su local (200)', subidaPortada.status === 200);
    comprobar(
      'se guarda la ruta',
      portadaJson?.datos?.imagen_portada?.startsWith('/uploads/portadas/') === true,
      portadaJson?.datos?.imagen_portada
    );
    rastro.portadaLocal = portadaJson?.datos?.imagen_portada;
  }

  if (rastro.portadaLocal) {
    const bajada = await fetch(`${BASE}${rastro.portadaLocal}`);
    const meta = await sharp(Buffer.from(await bajada.arrayBuffer())).metadata();
    comprobar(
      'sale panoramica en 1920x1000 y en webp',
      meta.width === 1920 && meta.height === 1000 && meta.format === 'webp',
      `${meta.format} ${meta.width}x${meta.height}`
    );
  }

  if (rastro.portadaLocal) {
    const enPublica = await fetch(`${BASE}/api/restaurantes/la-basilica`).then((r) => r.json());
    comprobar(
      'la ficha publica la devuelve',
      enPublica.datos?.imagen_portada === rastro.portadaLocal
    );
  }

  const portadaAjena = await fetch(`${BASE}/api/admin/restaurantes/4/portada`, {
    method: 'POST',
    headers: { authorization: `Bearer ${basilica.acceso}` },
    body: (() => {
      const f = new FormData();
      f.append('imagen', new Blob([portadaJpeg], { type: 'image/jpeg' }), 'x.jpg');
      return f;
    })(),
  });
  comprobar('un encargado no pone la portada de otro local (403)', portadaAjena.status === 403);

  if (rastro.portadaLocal) {
    const quitada = await basilica.peticion('DELETE', '/api/admin/restaurantes/2/portada');
    comprobar('se puede quitar la portada', quitada.cuerpo?.datos?.imagen_portada === null);
    rastro.portadaLocal = null;
  }

  // ---------------------------------------------------------------- QR
  seccion('QR de la carta');

  const qr = await admin.peticion('GET', '/api/admin/restaurantes/4/qr');
  comprobar('se genera el QR (200)', qr.status === 200);
  comprobar(
    'apunta a la carta publica del local',
    qr.cuerpo?.datos?.url?.endsWith('/el-descarado/carta'),
    qr.cuerpo?.datos?.url
  );
  comprobar('trae SVG', qr.cuerpo?.datos?.svg?.startsWith('<svg'));
  comprobar('trae PNG', qr.cuerpo?.datos?.png?.startsWith('data:image/png;base64,'));
  comprobar(
    'avisa de que con localhost no vale para imprimir',
    qr.cuerpo?.datos?.listoParaImprimir === false
  );

  const qrAjeno = await basilica.peticion('GET', '/api/admin/restaurantes/4/qr');
  comprobar('un encargado no saca el QR de otro local (403)', qrAjeno.status === 403);

  const qrPropio = await basilica.peticion('GET', '/api/admin/restaurantes/2/qr');
  comprobar('pero si el del suyo (200)', qrPropio.status === 200);

  // --------------------------------------------------------- reservas
  seccion('Reservas');

  const manana = new Date();
  manana.setUTCDate(manana.getUTCDate() + 1);
  const diaReserva = manana.toISOString().slice(0, 10);

  const tramos = await fetch(
    `${BASE}/api/reservas/tramos?restaurante_id=2&fecha=${diaReserva}`
  ).then((r) => r.json());
  comprobar('las horas disponibles salen del horario del local', tramos.datos?.tramos?.length > 0);
  comprobar(
    'no se ofrecen horas antes de abrir',
    tramos.datos.tramos[0] >= '12:30',
    tramos.datos.tramos[0]
  );

  const reservaWeb = await fetch(`${BASE}/api/reservas`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      restaurante_id: 2,
      nombre: 'Prueba de humo',
      telefono: '922000111',
      email: 'humo@ejemplo.es',
      fecha: diaReserva,
      hora: tramos.datos.tramos[0],
      comensales: 4,
      observaciones: 'Generada por la prueba de humo',
      politica_version: '2026-08-21',
      marketing: false,
    }),
  });
  const reservaJson = await reservaWeb.json();
  comprobar('una reserva web se acepta (201)', reservaWeb.status === 201);
  comprobar('entra como pendiente', reservaJson.datos?.estado === 'pendiente');
  comprobar(
    'devuelve un codigo legible de 6 caracteres',
    /^[A-Z2-9]{6}$/.test(reservaJson.datos?.codigo ?? ''),
    reservaJson.datos?.codigo
  );
  rastro.reservaCodigo = reservaJson.datos?.codigo;

  // ------------------------------------------------------------------ RGPD
  //
  // Sin haber informado no se puede recoger el telefono de un cliente. El
  // servidor tiene que exigirlo: si esto solo lo comprobara la casilla del
  // formulario, bastaria un curl para saltarselo, y la obligacion del art. 13
  // es de quien trata los datos, no del navegador.
  const sinPolitica = await fetch(`${BASE}/api/reservas`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      restaurante_id: 2,
      nombre: 'Sin politica',
      telefono: '922000333',
      fecha: diaReserva,
      hora: tramos.datos.tramos[0],
      comensales: 2,
    }),
  });
  const sinPoliticaCuerpo = await sinPolitica.json();
  comprobar('una reserva sin aceptar la politica se rechaza (400)', sinPolitica.status === 400);
  comprobar(
    'el 400 dice que campo falta',
    sinPoliticaCuerpo?.error?.detalles?.some((d) => d.campo === 'politica_version'),
    JSON.stringify(sinPoliticaCuerpo?.error?.detalles)
  );

  const fueraHorario = await fetch(`${BASE}/api/reservas`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      restaurante_id: 2,
      nombre: 'Fuera de hora',
      telefono: '922000222',
      fecha: diaReserva,
      hora: '10:00',
      comensales: 2,
    }),
  });
  comprobar('una hora en la que el local no ha abierto se rechaza (400)', fueraHorario.status === 400);

  const enElPasado = await fetch(`${BASE}/api/reservas`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      restaurante_id: 2,
      nombre: 'Ayer',
      telefono: '922000333',
      fecha: '2020-01-01',
      hora: '20:00',
      comensales: 2,
    }),
  });
  comprobar('una fecha pasada se rechaza (400)', enElPasado.status === 400);

  const bandeja = await basilica.peticion(
    'GET',
    `/api/admin/restaurantes/2/reservas?desde=${diaReserva}&hasta=${diaReserva}`
  );
  comprobar('el encargado ve la bandeja de su local (200)', bandeja.status === 200);
  const mia = bandeja.cuerpo.datos.find((r) => r.codigo === rastro.reservaCodigo);
  comprobar('y encuentra la reserva recien hecha', Boolean(mia));
  rastro.reservaId = mia?.id;

  const bandejaAjena = await basilica.peticion('GET', '/api/admin/restaurantes/4/reservas');
  comprobar('pero no la de otro local (403)', bandejaAjena.status === 403);

  const confirmada = await basilica.peticion('PATCH', `/api/admin/reservas/${rastro.reservaId}`, {
    estado: 'confirmada',
  });
  comprobar('confirmar la reserva funciona', confirmada.cuerpo?.datos?.estado === 'confirmada');
  comprobar(
    'y se genera el aviso al cliente, que tenia email',
    confirmada.cuerpo?.datos?.aviso !== null
  );

  const resumen = await basilica.peticion(
    'GET',
    `/api/admin/restaurantes/2/reservas/resumen?desde=${diaReserva}`
  );
  comprobar(
    'el resumen cuenta los comensales esperados',
    resumen.cuerpo?.datos?.comensales_esperados >= 4,
    JSON.stringify(resumen.cuerpo?.datos?.comensales)
  );

  // Mover una reserva a un hueco imposible tiene que fallar tambien desde el
  // panel: si no, se puede colocar una reserva un dia cerrado.
  const moverMal = await basilica.peticion('PATCH', `/api/admin/reservas/${rastro.reservaId}`, {
    hora: '04:00',
  });
  comprobar('mover una reserva fuera de horario se rechaza (400)', moverMal.status === 400);

  const bandejaAdmin = await admin.peticion('GET', '/api/admin/restaurantes/2/reservas');
  comprobar('el admin ve las reservas de cualquier local (200)', bandejaAdmin.status === 200);

  // -------------------------------------------------------- ocupacion
  seccion('Ocupacion del local');

  const pend = await basilica.peticion('GET', '/api/admin/restaurantes/2/ocupacion/pendiente');
  comprobar('se consulta si toca preguntar (200)', pend.status === 200);
  comprobar('viene el tramo horario en ISO', /^\d{4}-\d{2}-\d{2}T\d{2}:00:00/.test(pend.cuerpo?.datos?.tramo ?? ''));
  comprobar('vienen los cinco niveles', pend.cuerpo?.datos?.niveles?.length === 5);

  // Si ya habia una lectura de este tramo, la prueba la sobrescribiria y no
  // podria devolverla: se anota solo si el tramo estaba libre.
  if (!pend.cuerpo?.datos?.respondido) {
    rastro.ocupacionTramo = pend.cuerpo.datos.tramo.slice(0, 19).replace('T', ' ');
  }

  const registro = await basilica.peticion('POST', '/api/admin/restaurantes/2/ocupacion', {
    nivel: 3,
    comensales: 44,
    nota: 'Prueba de humo',
  });
  comprobar('sala registra la lectura (201)', registro.status === 201);
  comprobar('queda marcada como respondida', registro.cuerpo?.datos?.respondido === true);
  comprobar('y ya no toca preguntar', registro.cuerpo?.datos?.toca === false);

  // Volver a responder corrige, no duplica: en sala se falla el boton.
  const correccion = await basilica.peticion('POST', '/api/admin/restaurantes/2/ocupacion', {
    nivel: 4,
  });
  comprobar('responder otra vez corrige el mismo tramo', correccion.cuerpo?.datos?.respuesta?.nivel === 4);

  const histAforo = await basilica.peticion('GET', '/api/admin/restaurantes/2/ocupacion?dias=1');
  comprobar(
    'el tramo no se ha duplicado',
    histAforo.cuerpo?.datos?.length === 1,
    `hay ${histAforo.cuerpo?.datos?.length} lecturas`
  );
  comprobar(
    'la hora se guarda en horario de Canarias',
    Number.isInteger(histAforo.cuerpo?.datos?.[0]?.hora_local)
  );

  const nivelMalo = await basilica.peticion('POST', '/api/admin/restaurantes/2/ocupacion', {
    nivel: 9,
  });
  comprobar('un nivel fuera de rango se rechaza (400)', nivelMalo.status === 400);

  const ocupacionAjena = await basilica.peticion(
    'POST',
    '/api/admin/restaurantes/4/ocupacion',
    { nivel: 2 }
  );
  comprobar('un encargado no registra aforo de otro local (403)', ocupacionAjena.status === 403);

  const patronAforo = await admin.peticion(
    'GET',
    '/api/admin/restaurantes/2/ocupacion/patron?dias=90'
  );
  comprobar('el admin ve el patron de cualquier local (200)', patronAforo.status === 200);
  comprobar('con al menos una celda', patronAforo.cuerpo?.datos?.celdas?.length >= 1);

  // -------------------------------------------------------- categorias
  seccion('Secciones de la carta');

  const nombreCat = `Seccion ${Date.now()}`;
  const catCreada = await admin.peticion('POST', '/api/admin/categorias', { nombre: nombreCat });
  comprobar('admin crea una seccion (201)', catCreada.status === 201);
  rastro.categoriaId = catCreada.cuerpo?.datos?.id;
  comprobar(
    'el slug se genera sin tildes ni espacios',
    /^[a-z0-9-]+$/.test(catCreada.cuerpo?.datos?.slug ?? ''),
    catCreada.cuerpo?.datos?.slug
  );

  const catRepetida = await admin.peticion('POST', '/api/admin/categorias', { nombre: nombreCat });
  comprobar('no deja repetir el nombre (409)', catRepetida.status === 409);

  const catComoEncargado = await basilica.peticion('POST', '/api/admin/categorias', {
    nombre: 'No autorizada',
  });
  comprobar('un encargado no crea secciones (403)', catComoEncargado.status === 403);

  const catLeer = await basilica.peticion('GET', '/api/admin/categorias');
  comprobar('pero si las lee (200)', catLeer.status === 200);

  const catConPlatos = catLeer.cuerpo.datos.find((c) => c.platos > 0 && c.activo);
  const intentoBorrar = await admin.peticion('DELETE', `/api/admin/categorias/${catConPlatos.id}`);
  comprobar(
    'una seccion con platos se oculta en lugar de borrarse',
    intentoBorrar.cuerpo?.datos?.accion === 'desactivada',
    JSON.stringify(intentoBorrar.cuerpo?.datos?.accion)
  );
  // Se vuelve a dejar visible: es dato real del seed.
  await admin.peticion('PATCH', `/api/admin/categorias/${catConPlatos.id}`, { activo: true });

  const borrarVacia = await admin.peticion('DELETE', `/api/admin/categorias/${rastro.categoriaId}`);
  comprobar(
    'una seccion vacia si se borra del todo',
    borrarVacia.cuerpo?.datos?.accion === 'eliminada'
  );
  rastro.categoriaId = null;

  // ------------------------------------------------------ platos agotados
  seccion('Platos agotados');

  const agotadoHoy = await basilica.peticion('PATCH', `/api/admin/carta-items/${itemId}`, {
    agotado_hasta: 'hoy',
  });
  comprobar('el encargado marca un plato agotado (200)', agotadoHoy.status === 200);
  comprobar('queda marcado', agotadoHoy.cuerpo?.datos?.agotado === true);
  comprobar('con fecha de vuelta', Boolean(agotadoHoy.cuerpo?.datos?.agotado_hasta));

  const cartaConAgotado = await fetch(`${BASE}/api/restaurantes/la-basilica/carta`).then((r) =>
    r.json()
  );
  const platoAgotado = cartaConAgotado.datos.categorias
    .flatMap((c) => c.platos)
    .find((p) => p.carta_item_id === itemId);
  comprobar(
    'sigue saliendo en la carta publica, no se esconde',
    Boolean(platoAgotado),
    'ha desaparecido'
  );
  comprobar('y el cliente lo ve marcado como agotado', platoAgotado?.agotado === true);

  // La fecha de vuelta se evalua al leer, asi que envejecerla en base de datos
  // equivale a que haya pasado el dia.
  await bd.execute(
    'UPDATE carta_items SET agotado_hasta = NOW() - INTERVAL 1 HOUR WHERE id = ?',
    [itemId]
  );
  const yaVolvio = await fetch(`${BASE}/api/restaurantes/la-basilica/carta`).then((r) => r.json());
  comprobar(
    'pasada la fecha vuelve solo, sin tocar nada',
    yaVolvio.datos.categorias
      .flatMap((c) => c.platos)
      .find((p) => p.carta_item_id === itemId)?.agotado === false
  );

  const hastaFecha = await basilica.peticion('PATCH', `/api/admin/carta-items/${itemId}`, {
    agotado_hasta: '2099-01-01',
  });
  comprobar('se puede agotar hasta una fecha lejana', hastaFecha.cuerpo?.datos?.agotado === true);

  const deshecho = await basilica.peticion('PATCH', `/api/admin/carta-items/${itemId}`, {
    agotado_hasta: null,
  });
  comprobar('y deshacerlo a mano', deshecho.cuerpo?.datos?.agotado === false);

  const fechaInvalida = await basilica.peticion('PATCH', `/api/admin/carta-items/${itemId}`, {
    agotado_hasta: 'manana por la tarde',
  });
  comprobar('una fecha que no lo es se rechaza (400)', fechaInvalida.status === 400);

  const cartaDeOtro = await admin.peticion('GET', '/api/admin/restaurantes/1/carta');
  const itemDeOtro = cartaDeOtro.cuerpo.datos.categorias[0].items[0].id;
  const agotarAjeno = await basilica.peticion('PATCH', `/api/admin/carta-items/${itemDeOtro}`, {
    agotado_hasta: 'hoy',
  });
  comprobar('no se puede agotar un plato de otro local (404)', agotarAjeno.status === 404);

  // --------------------------------------------------- historico de precios
  seccion('Historico de precios');

  await basilica.peticion('PATCH', `/api/admin/carta-items/${itemId}`, { precio: 11.25 });
  await basilica.peticion('PATCH', `/api/admin/carta-items/${itemId}`, { precio: 12.0 });
  // Un PATCH que no cambia el precio no debe generar registro.
  await basilica.peticion('PATCH', `/api/admin/carta-items/${itemId}`, { precio: 12.0 });
  await basilica.peticion('PATCH', `/api/admin/carta-items/${itemId}`, { destacado: true });

  const hist = await basilica.peticion('GET', `/api/admin/carta-items/${itemId}/historico`);
  const registros = hist.cuerpo?.datos ?? [];
  comprobar('se registran 2 cambios de precio, no 4', registros.length === 2, `hay ${registros.length}`);
  comprobar(
    'el ultimo cambio es 11.25 -> 12.00',
    Number(registros[0]?.precio_anterior) === 11.25 && Number(registros[0]?.precio_nuevo) === 12,
    JSON.stringify(registros[0])
  );
  comprobar(
    'el historico guarda quien lo cambio',
    registros[0]?.usuario_email === 'labasilica@grupocobama.es',
    registros[0]?.usuario_email
  );

  const itemAjeno = await admin.peticion('GET', '/api/admin/restaurantes/1/carta');
  const idAjeno = itemAjeno.cuerpo?.datos?.categorias?.[0]?.items?.[0]?.id;
  const tocarAjeno = await basilica.peticion('PATCH', `/api/admin/carta-items/${idAjeno}`, {
    precio: 1,
  });
  comprobar(
    'el encargado no toca una linea de carta de otro local (404)',
    tocarAjeno.status === 404,
    `llego ${tocarAjeno.status}`
  );

  // ------------------------------------------------------------ reordenar
  seccion('Reordenar');

  const cartaActual = await basilica.peticion('GET', '/api/admin/restaurantes/2/carta');
  const ids = cartaActual.cuerpo.datos.categorias[0].items.map((i) => i.id);
  const alReves = [...ids].reverse();

  const reordenado = await basilica.peticion('PUT', '/api/admin/restaurantes/2/carta/orden', {
    orden: alReves,
  });
  comprobar('reordenar responde 200', reordenado.status === 200);

  const trasReordenar = await basilica.peticion('GET', '/api/admin/restaurantes/2/carta');
  const nuevosIds = trasReordenar.cuerpo.datos.categorias[0].items.map((i) => i.id);
  comprobar(
    'el orden guardado es el enviado',
    JSON.stringify(nuevosIds) === JSON.stringify(alReves),
    `${nuevosIds} vs ${alReves}`
  );

  const conAjeno = await basilica.peticion('PUT', '/api/admin/restaurantes/2/carta/orden', {
    orden: [...alReves, idAjeno],
  });
  comprobar('reordenar con una linea ajena se rechaza entero (400)', conAjeno.status === 400);

  // Se deja el orden como estaba: reordenar es la unica comprobacion que
  // toca datos reales del seed y no basta con borrar lo que ha creado.
  await basilica.peticion('PUT', '/api/admin/restaurantes/2/carta/orden', { orden: ids });
  const restaurado = await basilica.peticion('GET', '/api/admin/restaurantes/2/carta');
  comprobar(
    'el orden original queda restaurado',
    JSON.stringify(restaurado.cuerpo.datos.categorias[0].items.map((i) => i.id)) ===
      JSON.stringify(ids)
  );

  // ------------------------------------------- desactivar en cascada
  seccion('Borrado logico');

  await admin.peticion('DELETE', `/api/admin/platos/${platoId}`);
  const trasBorrar = await admin.peticion('GET', `/api/admin/platos/${platoId}`);
  comprobar('el plato sigue existiendo, desactivado', trasBorrar.cuerpo?.datos?.activo === false);
  comprobar(
    'desactivar el plato desactiva sus lineas de carta',
    trasBorrar.cuerpo?.datos?.en_cartas?.every((c) => c.activo === false)
  );

  const reactivar = await basilica.peticion('PATCH', `/api/admin/carta-items/${itemId}`, {
    activo: true,
  });
  comprobar(
    'no se reactiva una linea cuyo plato esta desactivado (400)',
    reactivar.status === 400
  );

  const publica = await fetch(`${BASE}/api/restaurantes/la-basilica/carta`).then((r) => r.json());
  const apareceEnPublica = publica.datos.categorias.some((c) =>
    c.platos.some((p) => p.id === platoId)
  );
  comprobar('el plato desactivado desaparece de la carta publica', !apareceEnPublica);

  // -------------------------------------------------------------- usuarios
  seccion('Usuarios');

  const emailPrueba = `humo-${Date.now()}@grupocobama.es`;
  const usuarioCreado = await admin.peticion('POST', '/api/admin/usuarios', {
    nombre: 'Usuario de prueba',
    email: emailPrueba,
    password: 'contrasenalarga',
    rol: 'encargado_local',
    restaurante_id: 3,
  });
  comprobar('admin crea un usuario (201)', usuarioCreado.status === 201);
  const usuarioId = usuarioCreado.cuerpo?.datos?.id;
  rastro.usuarioId = usuarioId;

  const incoherente = await admin.peticion('POST', '/api/admin/usuarios', {
    nombre: 'Admin con local',
    email: `malo-${Date.now()}@grupocobama.es`,
    password: 'contrasenalarga',
    rol: 'admin_grupo',
    restaurante_id: 1,
  });
  comprobar('un admin_grupo con local se rechaza (400)', incoherente.status === 400);

  const emailRepetido = await admin.peticion('POST', '/api/admin/usuarios', {
    nombre: 'Repetido',
    email: emailPrueba,
    password: 'contrasenalarga',
    rol: 'encargado_local',
    restaurante_id: 3,
  });
  comprobar('un email repetido se rechaza (409)', emailRepetido.status === 409);

  const autoDesactivar = await admin.peticion('PATCH', `/api/admin/usuarios/${admin.usuario.id}`, {
    activo: false,
  });
  comprobar('un admin no puede desactivarse a si mismo (400)', autoDesactivar.status === 400);

  // Cambiar la contrasena tiene que cerrar las sesiones abiertas del usuario.
  const nuevo = crearCliente();
  await nuevo.login(emailPrueba, 'contrasenalarga');
  await admin.peticion('PATCH', `/api/admin/usuarios/${usuarioId}`, {
    password: 'otracontrasenalarga',
  });
  const trasCambio = await nuevo.peticion('POST', '/api/auth/refresh');
  comprobar(
    'cambiar la contrasena revoca las sesiones abiertas (401)',
    trasCambio.status === 401,
    `llego ${trasCambio.status}`
  );

  const desactivado = await admin.peticion('DELETE', `/api/admin/usuarios/${usuarioId}`);
  comprobar('admin desactiva al usuario', desactivado.cuerpo?.datos?.activo === false);

}

/** Borra lo que haya creado la prueba, haya terminado bien o mal. */
async function limpiar() {
  const { pool } = await import('../src/config/db.js');
  try {
    if (rastro.itemId) {
      await pool.execute('DELETE FROM historico_precios WHERE carta_item_id = ?', [rastro.itemId]);
      await pool.execute('DELETE FROM carta_items WHERE id = ?', [rastro.itemId]);
    }
    if (rastro.platoId) {
      // Puede haber quedado alguna linea de carta si la prueba murio antes de
      // llegar a crearla por la via normal.
      await pool.execute(
        'DELETE hp FROM historico_precios hp JOIN carta_items ci ON ci.id = hp.carta_item_id WHERE ci.plato_id = ?',
        [rastro.platoId]
      );
      await pool.execute('DELETE FROM carta_items WHERE plato_id = ?', [rastro.platoId]);
      await pool.execute('DELETE FROM plato_alergenos WHERE plato_id = ?', [rastro.platoId]);
      await pool.execute('DELETE FROM platos WHERE id = ?', [rastro.platoId]);
    }
    if (rastro.platoNuevoId) {
      await pool.execute(
        'DELETE hp FROM historico_precios hp JOIN carta_items ci ON ci.id = hp.carta_item_id WHERE ci.plato_id = ?',
        [rastro.platoNuevoId]
      );
      await pool.execute('DELETE FROM carta_items WHERE plato_id = ?', [rastro.platoNuevoId]);
      await pool.execute('DELETE FROM plato_alergenos WHERE plato_id = ?', [rastro.platoNuevoId]);
      await pool.execute('DELETE FROM platos WHERE id = ?', [rastro.platoNuevoId]);
    }
    if (rastro.platoEncargadoId) {
      await pool.execute(
        'DELETE hp FROM historico_precios hp JOIN carta_items ci ON ci.id = hp.carta_item_id WHERE ci.plato_id = ?',
        [rastro.platoEncargadoId]
      );
      await pool.execute('DELETE FROM carta_items WHERE plato_id = ?', [rastro.platoEncargadoId]);
      await pool.execute('DELETE FROM plato_alergenos WHERE plato_id = ?', [rastro.platoEncargadoId]);
      await pool.execute('DELETE FROM platos WHERE id = ?', [rastro.platoEncargadoId]);
    }
    if (rastro.categoriaId) {
      await pool.execute('DELETE FROM categorias WHERE id = ?', [rastro.categoriaId]);
    }
    if (rastro.ocupacionTramo) {
      // Acotado al tramo exacto que ha escrito la prueba: una lectura real
      // normalmente no lleva nota, asi que borrar por nota se llevaria datos
      // buenos por delante.
      await pool.execute('DELETE FROM ocupacion WHERE restaurante_id = 2 AND tramo = ?', [
        rastro.ocupacionTramo,
      ]);
    }
    if (rastro.reservaId) {
      await pool.execute('DELETE FROM reservas WHERE id = ?', [rastro.reservaId]);
    }
    if (rastro.usuarioId) {
      await pool.execute('DELETE FROM refresh_tokens WHERE usuario_id = ?', [rastro.usuarioId]);
      await pool.execute('DELETE FROM usuarios WHERE id = ?', [rastro.usuarioId]);
    }
    console.log('\nLimpieza\n  ok    datos de prueba eliminados');
  } finally {
    await pool.end();
  }
}

let roto = null;
try {
  await main();
} catch (err) {
  roto = err;
}

await limpiar().catch((err) => console.error('  FALLO al limpiar:', err.message));

if (roto) {
  console.error('\nLa prueba se ha roto:', roto);
  process.exit(1);
}

console.log(`\n${pruebas - fallos}/${pruebas} comprobaciones correctas.`);
if (fallos > 0) {
  console.log(`${fallos} FALLOS.`);
  process.exit(1);
}
