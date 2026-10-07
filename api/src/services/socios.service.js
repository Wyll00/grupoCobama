import { randomInt } from 'node:crypto';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { hoyEnCanarias } from '../utils/horarios.js';

/**
 * Tarjeta de socio: visitas y premios.
 *
 * Un cliente se hace socio, recibe una tarjeta con su codigo y su QR, y cada
 * vez que viene sala le apunta la visita. Al llegar a VISITAS_POR_PREMIO se le
 * premia.
 *
 * LAS VISITAS CUENTAN EN EL GRUPO ENTERO. Cada visita guarda en que casa fue
 * -eso no se pierde-, pero lo que suma para el premio es el total de las
 * cuatro. Para hacerlo por casa basta con anadir el restaurante al COUNT de
 * `contarVisitas`; la tabla ya lo guarda.
 */

export const VISITAS_POR_PREMIO = 8;

// Mismo alfabeto que los codigos de reserva: sin 0/O ni 1/I/L, que al
// dictarlos por telefono se confunden. La tarjeta se dicta cuando el movil se
// ha quedado sin bateria, que pasa.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generarCodigo() {
  let codigo = '';
  for (let i = 0; i < 8; i += 1) codigo += ALFABETO[randomInt(ALFABETO.length)];
  return codigo;
}

const SELECT_SOCIO = `
  SELECT s.id, s.codigo, s.nombre, s.telefono, s.email, s.activo, s.created_at,
         r.slug AS alta_slug, r.nombre AS alta_nombre
    FROM socios s
    LEFT JOIN restaurantes r ON r.id = s.alta_restaurante_id
`;

async function contarVisitas(socioId) {
  const [[fila]] = await pool.execute(
    'SELECT COUNT(*) AS n FROM socio_visitas WHERE socio_id = ?',
    [socioId]
  );
  return Number(fila.n);
}

/**
 * Los premios que le tocan a alguien por el numero de visitas que lleva.
 *
 * Se calcula a partir del total y no se lleva un contador aparte: un contador
 * se desincroniza en cuanto alguien borra una visita apuntada por error, y
 * entonces hay que explicarle a un cliente por que su tarjeta dice una cosa y
 * el papel otra.
 *
 * Es `INSERT IGNORE` contra una clave unica por escalon: si dos casas apuntan
 * una visita en el mismo segundo, el octavo premio se crea una sola vez.
 */
async function otorgarPremiosPendientes(socioId, visitas) {
  const escalones = [];
  for (let n = VISITAS_POR_PREMIO; n <= visitas; n += VISITAS_POR_PREMIO) {
    escalones.push(n);
  }
  if (escalones.length === 0) return;

  const huecos = escalones.map(() => '(?, ?)').join(', ');
  await pool.query(
    `INSERT IGNORE INTO socio_premios (socio_id, visitas) VALUES ${huecos}`,
    escalones.flatMap((n) => [socioId, n])
  );
}

async function premiosDe(socioId) {
  const [filas] = await pool.execute(
    `SELECT p.id, p.visitas, p.ganado_en, p.entregado_en, p.entregado_nota,
            u.nombre AS entregado_por_nombre
       FROM socio_premios p
       LEFT JOIN usuarios u ON u.id = p.entregado_por
      WHERE p.socio_id = ?
      ORDER BY p.visitas`,
    [socioId]
  );
  return filas;
}

async function visitasDe(socioId, limite = 30) {
  const [filas] = await pool.query(
    `SELECT v.id, v.fecha, v.nota, r.slug, r.nombre AS local
       FROM socio_visitas v
       JOIN restaurantes r ON r.id = v.restaurante_id
      WHERE v.socio_id = ?
      ORDER BY v.fecha DESC, v.id DESC
      LIMIT ?`,
    [socioId, limite]
  );
  return filas;
}

/** Lo que se pinta en la tarjeta. */
async function componer(socio) {
  const visitas = await contarVisitas(socio.id);
  const [premios, historial] = await Promise.all([
    premiosDe(socio.id),
    visitasDe(socio.id),
  ]);

  // Lo que falta para la siguiente recompensa. Con 8 justas es 0, no 8: ya la
  // tiene ganada y lo que toca es ensenarsela, no pedirle otras ocho.
  const enElTramo = visitas % VISITAS_POR_PREMIO;
  const pendientes = premios.filter((p) => !p.entregado_en);

  return {
    codigo: socio.codigo,
    nombre: socio.nombre,
    activo: Boolean(socio.activo),
    socioDesde: socio.created_at,
    altaEn: socio.alta_nombre ? { slug: socio.alta_slug, nombre: socio.alta_nombre } : null,

    visitas,
    visitasParaElPremio: VISITAS_POR_PREMIO,
    enElTramo,
    // Cuantas le faltan. Si acaba de ganar uno, cero.
    faltan: pendientes.length > 0 ? 0 : VISITAS_POR_PREMIO - enElTramo,

    premiosGanados: premios.length,
    premiosPendientes: pendientes.length,
    premios,
    historial,
  };
}

/** La tarjeta, por su codigo. Es lo que abre el QR. */
export async function porCodigo(codigo) {
  const [filas] = await pool.execute(`${SELECT_SOCIO} WHERE s.codigo = ? LIMIT 1`, [
    String(codigo).trim().toUpperCase(),
  ]);

  const socio = filas[0];
  if (!socio) throw ApiError.noEncontrado('Esa tarjeta no existe');
  return componer(socio);
}

export async function porId(id) {
  const [filas] = await pool.execute(`${SELECT_SOCIO} WHERE s.id = ? LIMIT 1`, [id]);
  const socio = filas[0];
  if (!socio) throw ApiError.noEncontrado('Ese socio no existe');
  return componer(socio);
}

/**
 * Alta de socio.
 *
 * El codigo se genera aqui y se reintenta si choca. Con 31 letras y 8
 * posiciones el choque es improbabilisimo, pero "improbable" no es "imposible"
 * y el error que daria -una clave duplicada en la cara del cliente mientras
 * cena- no es el que uno quiere depurar en sala.
 */
export async function crear(
  {
    nombre,
    telefono = null,
    email = null,
    politica_version: politicaVersion = null,
    marketing = false,
  },
  { restauranteId = null, via = 'sala' } = {}
) {
  /*
    La fecha del consentimiento la pone el SERVIDOR, no el cliente.

    Es la prueba de cuando se acepto (art. 7.1). Si viniera en el cuerpo de la
    peticion, cualquiera podria mandar la fecha que quisiera y la prueba no
    probaria nada. Lo unico que se acepta de fuera es QUE version se enseno,
    porque eso el servidor no lo sabe.
  */
  const ahora = politicaVersion ? new Date() : null;

  for (let intento = 0; intento < 5; intento += 1) {
    const codigo = generarCodigo();
    try {
      const [res] = await pool.execute(
        `INSERT INTO socios
           (codigo, nombre, telefono, email, alta_restaurante_id,
            politica_version, politica_aceptada_en, marketing, marketing_en, via)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          codigo,
          nombre,
          telefono,
          email,
          restauranteId,
          politicaVersion,
          ahora,
          marketing ? 1 : 0,
          marketing ? new Date() : null,
          via,
        ]
      );
      return porId(res.insertId);
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e;
    }
  }
  throw ApiError.conflicto('No se ha podido generar un codigo de socio libre');
}

/**
 * Apunta una visita.
 *
 * Devuelve `repetida: true` cuando ya habia una de esa casa y ese dia, en vez
 * de fallar: en sala lo normal no es el fraude, es pulsar dos veces porque no
 * se vio si habia cogido. Con un error, quien lo pulsa se queda sin saber si
 * la primera entro.
 */
export async function apuntarVisita(codigo, { restauranteId, usuarioId = null, nota = null }) {
  const [filas] = await pool.execute(
    'SELECT id, activo FROM socios WHERE codigo = ? LIMIT 1',
    [String(codigo).trim().toUpperCase()]
  );

  const socio = filas[0];
  if (!socio) throw ApiError.noEncontrado('Esa tarjeta no existe');
  if (!socio.activo) throw ApiError.peticionInvalida('Esa tarjeta esta dada de baja');

  const fecha = hoyEnCanarias();

  const [res] = await pool.execute(
    `INSERT IGNORE INTO socio_visitas (socio_id, restaurante_id, fecha, usuario_id, nota)
     VALUES (?, ?, ?, ?, ?)`,
    [socio.id, restauranteId, fecha, usuarioId, nota]
  );

  const repetida = res.affectedRows === 0;

  const visitas = await contarVisitas(socio.id);
  await otorgarPremiosPendientes(socio.id, visitas);

  const tarjeta = await porId(socio.id);
  return { ...tarjeta, repetida };
}

/** Marca un premio como entregado. */
export async function entregarPremio(premioId, { usuarioId = null, nota = null }) {
  const [filas] = await pool.execute(
    'SELECT id, socio_id, entregado_en FROM socio_premios WHERE id = ? LIMIT 1',
    [premioId]
  );

  const premio = filas[0];
  if (!premio) throw ApiError.noEncontrado('Ese premio no existe');
  if (premio.entregado_en) throw ApiError.peticionInvalida('Ese premio ya estaba entregado');

  await pool.execute(
    `UPDATE socio_premios
        SET entregado_en = NOW(), entregado_por = ?, entregado_nota = ?
      WHERE id = ?`,
    [usuarioId, nota, premioId]
  );

  return porId(premio.socio_id);
}

/** Busca socios por codigo, nombre, telefono o email. */
export async function buscar({ q = '', limite = 25 } = {}) {
  const termino = String(q).trim();

  if (!termino) {
    const [filas] = await pool.query(
      `${SELECT_SOCIO} ORDER BY s.created_at DESC LIMIT ?`,
      [limite]
    );
    return Promise.all(filas.map(componer));
  }

  const como = `%${termino}%`;
  const [filas] = await pool.query(
    `${SELECT_SOCIO}
      WHERE s.codigo = ? OR s.nombre LIKE ? OR s.telefono LIKE ? OR s.email LIKE ?
      ORDER BY s.created_at DESC
      LIMIT ?`,
    [termino.toUpperCase(), como, como, como, limite]
  );

  return Promise.all(filas.map(componer));
}
