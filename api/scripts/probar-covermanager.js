/**
 * Prueba la maquinaria de envio a CoverManager contra un servidor falso.
 *
 *   npm run cm --prefix api
 *
 * Lo que se prueba aqui es NUESTRO lado: los estados, el reclamo atomico, los
 * reintentos con espera creciente y la diferencia entre un fallo pasajero y
 * uno definitivo. El contrato real de su API sigue sin confirmar (ver el
 * aviso en src/integraciones/covermanager.js), pero todo esto funciona igual
 * independientemente de como se llamen sus campos.
 *
 * No toca ningun dato real: crea su propio local y sus propias reservas con
 * un sufijo unico, y los borra al final pase lo que pase.
 */
import { createServer } from 'node:http';
import 'dotenv/config';

let fallos = 0;
const comprobar = (que, ok, extra = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FALLA'}  ${que}${ok || !extra ? '' : `  -> ${extra}`}`);
  if (!ok) fallos += 1;
};

/** Servidor falso. `guion` decide que responde en cada llamada. */
function levantarFalso(guion) {
  const recibidas = [];
  const servidor = createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (c) => (cuerpo += c));
    req.on('end', () => {
      const paso = guion[Math.min(recibidas.length, guion.length - 1)];
      recibidas.push({ ruta: req.url, cabeceras: req.headers, cuerpo: JSON.parse(cuerpo || '{}') });
      if (paso.colgar) return; // no responde nunca: prueba el timeout
      res.writeHead(paso.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(paso.json ?? {}));
    });
  });
  return new Promise((resolver) => {
    servidor.listen(0, '127.0.0.1', () =>
      resolver({ servidor, recibidas, puerto: servidor.address().port })
    );
  });
}

async function main() {
  const sufijo = String(Date.now()).slice(-3);
  const falso = await levantarFalso([
    { status: 201, json: { id: 'CM-111' } },
    { status: 500, json: { error: 'boom' } },
    { status: 422, json: { message: 'No quedan mesas a esa hora' } },
    { colgar: true },
  ]);

  // El adaptador lee process.env al cargarse, asi que hay que ponerlo antes
  // de importarlo.
  process.env.COVERMANAGER_URL = `http://127.0.0.1:${falso.puerto}`;
  process.env.COVERMANAGER_API_KEY = 'clave-de-prueba';
  process.env.COVERMANAGER_TIMEOUT_MS = '600';

  const { pool } = await import('../src/config/db.js');
  const sincro = await import('../src/services/sincronizacion.service.js');
  const cmMod = await import('../src/integraciones/covermanager.js');

  const rastro = { localId: null, otroId: null, reservaIds: [] };

  const crearReserva = async (codigo, localId) => {
    const [r] = await pool.execute(
      `INSERT INTO reservas
         (codigo, restaurante_id, nombre, telefono, fecha, hora, comensales, estado, origen)
       VALUES (?, ?, 'Prueba CM', '600000000', CURDATE(), '21:00', 2, 'pendiente', 'web')`,
      [codigo, localId]
    );
    rastro.reservaIds.push(r.insertId);
    return r.insertId;
  };

  const estado = async (id) => {
    const [f] = await pool.execute(
      `SELECT cm_estado, cm_id, cm_intentos, cm_ultimo_error, cm_proximo_intento
         FROM reservas WHERE id = ?`,
      [id]
    );
    return f[0];
  };

  try {
    console.log('\nConfiguracion');
    comprobar('el adaptador se ve configurado', cmMod.estaConfigurado());

    // Local de prueba propio: no se toca ninguno de los cuatro de verdad.
    const [local] = await pool.execute(
      `INSERT INTO restaurantes
         (slug, nombre, municipio, direccion, telefono, activo, covermanager_id)
       VALUES (?, 'Local de prueba CM', 'Pruebas', 'Calle Falsa 1', '600000000', 0, 'CM-LOCAL-1')`,
      [`prueba-cm-${sufijo}-${Date.now()}`]
    );
    rastro.localId = local.insertId;

    console.log('\nEnvio correcto');
    const codigo1 = `CMA${sufijo}`;
    const r1 = await crearReserva(codigo1, rastro.localId);
    comprobar('se marca para envio', (await sincro.marcarParaEnvio(r1)) === 'pendiente');
    comprobar('el envio sale bien', (await sincro.intentarUna(r1)) === 'enviada');

    const e1 = await estado(r1);
    comprobar('guarda el id que devuelve CoverManager', e1.cm_id === 'CM-111', e1.cm_id);
    comprobar('no deja ningun error colgado', e1.cm_ultimo_error === null);

    const enviada = falso.recibidas[0];
    comprobar(
      'manda la clave en la cabecera',
      enviada.cabeceras.authorization === 'Bearer clave-de-prueba'
    );
    comprobar(
      'manda nuestro codigo como referencia externa',
      enviada.cuerpo.external_id === codigo1,
      enviada.cuerpo.external_id
    );
    comprobar(
      'manda el id del local en CoverManager, no el nuestro',
      enviada.cuerpo.restaurant_id === 'CM-LOCAL-1',
      String(enviada.cuerpo.restaurant_id)
    );

    console.log('\nReclamo atomico (que no se mande dos veces)');
    comprobar('reintentar una ya enviada no hace nada', (await sincro.intentarUna(r1)) === null);
    comprobar(
      'sigue habiendo una sola llamada',
      falso.recibidas.length === 1,
      String(falso.recibidas.length)
    );

    console.log('\nFallo pasajero (500)');
    const r2 = await crearReserva(`CMB${sufijo}`, rastro.localId);
    await sincro.marcarParaEnvio(r2);
    comprobar('un 500 deja la reserva en error', (await sincro.intentarUna(r2)) === 'error');
    const e2 = await estado(r2);
    comprobar('cuenta el intento', e2.cm_intentos === 1, String(e2.cm_intentos));
    comprobar('programa un reintento', e2.cm_proximo_intento !== null);
    comprobar('anota que fue un 500', e2.cm_ultimo_error.includes('500'), e2.cm_ultimo_error);

    console.log('\nRechazo definitivo (422)');
    const r3 = await crearReserva(`CMC${sufijo}`, rastro.localId);
    await sincro.marcarParaEnvio(r3);
    comprobar('un 422 deja la reserva en error', (await sincro.intentarUna(r3)) === 'error');
    const e3 = await estado(r3);
    comprobar(
      'un rechazo NO se reintenta en bucle',
      e3.cm_proximo_intento === null,
      String(e3.cm_proximo_intento)
    );
    comprobar(
      'guarda el motivo que dio CoverManager',
      e3.cm_ultimo_error.includes('No quedan mesas'),
      e3.cm_ultimo_error
    );

    console.log('\nTimeout');
    const r4 = await crearReserva(`CMD${sufijo}`, rastro.localId);
    await sincro.marcarParaEnvio(r4);
    comprobar('una API colgada no bloquea para siempre', (await sincro.intentarUna(r4)) === 'error');
    const e4 = await estado(r4);
    comprobar('el timeout se trata como pasajero y se reintenta', e4.cm_proximo_intento !== null);

    console.log('\nLocal sin CoverManager');
    const [otro] = await pool.execute(
      `INSERT INTO restaurantes (slug, nombre, municipio, direccion, telefono, activo)
       VALUES (?, 'Local sin CM', 'Pruebas', 'Calle Falsa 2', '600000000', 0)`,
      [`prueba-sincm-${sufijo}-${Date.now()}`]
    );
    rastro.otroId = otro.insertId;
    const r5 = await crearReserva(`CME${sufijo}`, rastro.otroId);
    comprobar(
      'un local sin covermanager_id queda en no_aplica',
      (await sincro.marcarParaEnvio(r5)) === 'no_aplica'
    );

    console.log('\nReintento a mano desde el panel');
    const tras = await sincro.reintentar(r3);
    comprobar('reintentar limpia la espera y vuelve a intentarlo', tras !== null, String(tras));
    const e3b = await estado(r3);
    comprobar('el contador de intentos se reinicia', e3b.cm_intentos === 1, String(e3b.cm_intentos));

    console.log(`\n${fallos === 0 ? 'Todo correcto' : `${fallos} comprobaciones han fallado`}.`);
    process.exitCode = fallos === 0 ? 0 : 1;
  } finally {
    // Pase lo que pase, no queda basura. Las reservas primero: la clave ajena
    // a restaurantes impide borrar el local mientras existan.
    const { pool } = await import('../src/config/db.js');
    for (const id of rastro.reservaIds) {
      await pool.execute('DELETE FROM reservas WHERE id = ?', [id]).catch(() => {});
    }
    for (const id of [rastro.localId, rastro.otroId]) {
      if (id) await pool.execute('DELETE FROM restaurantes WHERE id = ?', [id]).catch(() => {});
    }
    await pool.end().catch(() => {});
    falso.servidor.close();
    console.log('Datos de prueba eliminados.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
