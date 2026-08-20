/**
 * Diagnostico de la integracion con CoverManager.
 *
 *   npm run cm-check --prefix api                 que se enviaria, sin enviar nada
 *   npm run cm-check --prefix api -- --enviar     lo manda de verdad
 *   npm run cm-check --prefix api -- --enviar --codigo ABC123
 *
 * Sirve para dos momentos distintos:
 *
 * 1) ANTES de tener credenciales. Con `--simular` (por defecto) imprime la
 *    peticion exacta que saldria. Ese volcado se le puede reenviar tal cual al
 *    contacto de CoverManager preguntando "confirmame si esto es correcto".
 *    Convierte un contrato desconocido en una pregunta concreta que se puede
 *    contestar en un correo.
 *
 * 2) DESPUES de tenerlas. Con `--enviar` manda una reserva real y ensena la
 *    respuesta cruda. Si algo no cuadra, aqui se ve exactamente que: la ruta,
 *    el status, el cuerpo que devuelven.
 *
 * No inventa nada: usa la misma funcion PETICION() que usa la aplicacion, asi
 * que lo que se ve aqui es literalmente lo que se manda en produccion.
 */
import 'dotenv/config';
import { pool } from '../src/config/db.js';

const argumentos = process.argv.slice(2);
const enviarDeVerdad = argumentos.includes('--enviar');
const codigoPedido = argumentos[argumentos.indexOf('--codigo') + 1];

const linea = (t = '') => console.log(t);
const titulo = (t) => {
  linea();
  linea(t);
  linea('-'.repeat(t.length));
};

async function main() {
  titulo('1. Configuracion');

  const url = process.env.COVERMANAGER_URL ?? '';
  const clave = process.env.COVERMANAGER_API_KEY ?? '';

  linea(`  COVERMANAGER_URL      ${url || '(sin definir)'}`);
  linea(`  COVERMANAGER_API_KEY  ${clave ? `definida (${clave.length} caracteres)` : '(sin definir)'}`);
  linea(`  Timeout               ${process.env.COVERMANAGER_TIMEOUT_MS ?? 8000} ms`);

  const configurado = Boolean(url && clave);
  if (!configurado) {
    linea();
    linea('  La integracion esta APAGADA. La aplicacion funciona igual que');
    linea('  siempre: la reserva se guarda en la base y no se envia a nadie.');
  }

  titulo('2. Locales');

  const [locales] = await pool.execute(
    'SELECT id, nombre, slug, covermanager_id FROM restaurantes WHERE activo = 1 ORDER BY orden'
  );
  let integrados = 0;
  for (const l of locales) {
    if (l.covermanager_id) integrados += 1;
    linea(
      `  ${l.nombre.padEnd(20)} ${l.covermanager_id ? `-> ${l.covermanager_id}` : '(sin covermanager_id: no se envia)'}`
    );
  }
  if (integrados === 0) {
    linea();
    linea('  Ningun local tiene covermanager_id. Se pone con:');
    linea("    UPDATE restaurantes SET covermanager_id = 'XXX' WHERE slug = 'la-basilica';");
  }

  titulo('3. Reserva de ejemplo');

  // Se coge una reserva de verdad para que el volcado sea creible. Si no hay
  // ninguna, se usa una inventada: sirve igual para ensenar el formato.
  let reserva;
  let local;

  const [filas] = await pool.execute(
    `SELECT r.id, r.codigo, r.nombre, r.telefono, r.email, r.fecha, r.hora,
            r.comensales, r.observaciones, r.cm_estado,
            res.id AS local_id, res.nombre AS local_nombre, res.covermanager_id
       FROM reservas r
       JOIN restaurantes res ON res.id = r.restaurante_id
      WHERE r.anonimizada_en IS NULL ${codigoPedido ? 'AND r.codigo = ?' : ''}
      ORDER BY r.created_at DESC
      LIMIT 1`,
    codigoPedido ? [codigoPedido] : []
  );

  if (filas.length > 0) {
    const f = filas[0];
    reserva = f;
    local = { id: f.local_id, nombre: f.local_nombre, covermanager_id: f.covermanager_id };
    linea(`  Usando la reserva ${f.codigo} de ${f.local_nombre} (estado de envio: ${f.cm_estado})`);
  } else {
    if (codigoPedido) {
      linea(`  No existe ninguna reserva con codigo ${codigoPedido}.`);
      return;
    }
    reserva = {
      id: 0,
      codigo: 'EJEM01',
      nombre: 'Nombre de ejemplo',
      telefono: '+34600000000',
      email: 'ejemplo@correo.es',
      fecha: new Date().toLocaleDateString('en-CA'),
      hora: '21:00',
      comensales: 2,
      observaciones: 'Mesa junto a la ventana si es posible',
    };
    local = locales[0]
      ? { ...locales[0], covermanager_id: locales[0].covermanager_id ?? 'ID-DEL-LOCAL' }
      : { id: 0, nombre: 'Local', covermanager_id: 'ID-DEL-LOCAL' };
    linea('  No hay reservas en la base: se usa una de ejemplo.');
  }

  titulo('4. Lo que se enviaria');

  // Este volcado esta pensado para pegarlo en un correo a CoverManager, asi
  // que NUNCA puede llevar datos de un cliente de verdad. Lo que hay que
  // ensenar es el formato, no los valores: se sustituyen por unos de mentira
  // manteniendo la forma (longitud del telefono, dominio del email...).
  //
  // Se enmascara siempre, tambien cuando se pide una reserva concreta con
  // --codigo: el motivo para pedirla es depurar el formato, y para eso el
  // nombre real no aporta nada.
  const reservaVisible = {
    ...reserva,
    nombre: 'Nombre Apellido',
    telefono: '+34600000000',
    email: reserva.email ? 'cliente@ejemplo.es' : null,
    observaciones: reserva.observaciones ? 'Texto libre que escribe el cliente' : null,
  };

  // La misma funcion que usa la aplicacion. Se importa aqui dentro porque lee
  // process.env al cargarse.
  const cm = await import('../src/integraciones/covermanager.js');
  const peticion = cm.__peticionParaDiagnostico({ reserva: reservaVisible, local });

  linea(`  ${peticion.metodo} ${url || '<COVERMANAGER_URL>'}${peticion.camino}`);
  linea();
  for (const [k, v] of Object.entries(peticion.cabeceras)) {
    // La clave no se imprime entera ni en un volcado de diagnostico: esto
    // se pega en correos y en chats.
    const valor = k.toLowerCase() === 'authorization' ? 'Bearer <COVERMANAGER_API_KEY>' : v;
    linea(`  ${k}: ${valor}`);
  }
  linea();
  linea(JSON.stringify(peticion.cuerpo, null, 2).split('\n').map((l) => `  ${l}`).join('\n'));

  linea();
  linea('  (Los datos personales van sustituidos por unos de ejemplo: este');
  linea('   volcado se pega en correos y no puede llevar datos de clientes.');
  linea('   Con --enviar se manda la reserva de verdad, sin cambiar nada.)');

  linea();
  linea('  >> Esto es lo que hay que confirmar con CoverManager:');
  linea('     - Es correcta la ruta?');
  linea('     - Se autentica asi, con Bearer, o con otra cabecera?');
  linea('     - Se llaman asi los campos?');
  linea('     - Admiten external_id como referencia del cliente para evitar');
  linea('       duplicados? Si no, como lo evitan ellos?');
  linea('     - En que campo viene el identificador de la reserva creada?');

  if (!enviarDeVerdad) {
    titulo('5. Envio');
    linea('  No se ha enviado nada (modo simulacion).');
    linea('  Para enviarlo de verdad:  npm run cm-check --prefix api -- --enviar');
    return;
  }

  titulo('5. Envio real');

  if (!configurado) {
    linea('  No se puede enviar: faltan COVERMANAGER_URL y COVERMANAGER_API_KEY.');
    return;
  }
  if (!local.covermanager_id || local.covermanager_id === 'ID-DEL-LOCAL') {
    linea(`  No se puede enviar: ${local.nombre} no tiene covermanager_id.`);
    return;
  }

  const empezo = Date.now();
  try {
    const res = await cm.enviarReserva({ reserva, local });
    linea(`  OK en ${Date.now() - empezo} ms.`);
    linea(`  Identificador devuelto: ${res.id}`);
    linea();
    linea('  Ahora abre el panel de CoverManager y comprueba que la reserva');
    linea('  aparece ahi. Que la API responda 200 no garantiza que se haya');
    linea('  creado la mesa: eso solo se ve en su panel.');
  } catch (e) {
    linea(`  FALLO en ${Date.now() - empezo} ms.`);
    linea(`  Tipo:    ${e.permanente ? 'permanente (no se reintenta)' : 'temporal (se reintenta)'}`);
    linea(`  Mensaje: ${e.message}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
