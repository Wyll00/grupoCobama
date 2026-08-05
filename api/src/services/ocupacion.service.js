import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { ahoraEnCanarias, estaAbiertoAhora } from '../utils/horarios.js';

export const NIVELES = [
  { valor: 0, clave: 'vacio', etiqueta: 'Vacio', descripcion: 'Casi no hay nadie' },
  { valor: 1, clave: 'flojo', etiqueta: 'Flojo', descripcion: 'Menos de la mitad' },
  { valor: 2, clave: 'normal', etiqueta: 'Normal', descripcion: 'Sobre la mitad' },
  { valor: 3, clave: 'lleno', etiqueta: 'Lleno', descripcion: 'Quedan pocas mesas' },
  { valor: 4, clave: 'a_tope', etiqueta: 'A tope', descripcion: 'Sin sitio, hay espera' },
];

/** Inicio del tramo horario actual, en UTC. */
function tramoActual(fecha = new Date()) {
  const t = new Date(fecha);
  t.setUTCMinutes(0, 0, 0);
  return t;
}

/** 'YYYY-MM-DD HH:MM:SS' en UTC, que es lo que espera MySQL con dateStrings. */
const aMySQL = (fecha) => fecha.toISOString().slice(0, 19).replace('T', ' ');

async function horariosDe(restauranteId) {
  const [filas] = await pool.execute(
    'SELECT dia_semana, hora_apertura, hora_cierre, cerrado FROM horarios WHERE restaurante_id = ?',
    [restauranteId]
  );
  return filas;
}

/**
 * Decide si toca preguntar por la ocupacion.
 *
 * Solo con el local abierto: preguntar a las cinco de la manana no da ningun
 * dato y solo consigue que en sala dejen de hacer caso al aviso.
 */
export async function pendiente(restauranteId) {
  const tramo = tramoActual();
  const horarios = await horariosDe(restauranteId);
  const abierto = estaAbiertoAhora(horarios);

  const [filas] = await pool.execute(
    `SELECT id, nivel, comensales, nota, tramo, hora_local
       FROM ocupacion
      WHERE restaurante_id = ? AND tramo = ?
      LIMIT 1`,
    [restauranteId, aMySQL(tramo)]
  );

  const [ultimas] = await pool.execute(
    `SELECT o.nivel, o.tramo, o.hora_local, u.nombre AS usuario_nombre
       FROM ocupacion o
       LEFT JOIN usuarios u ON u.id = o.usuario_id
      WHERE o.restaurante_id = ?
      ORDER BY o.tramo DESC
      LIMIT 1`,
    [restauranteId]
  );

  return {
    // El tramo va en ISO para que el cliente no tenga que adivinar la zona.
    tramo: tramo.toISOString(),
    abierto,
    respondido: Boolean(filas[0]),
    respuesta: filas[0] ?? null,
    toca: abierto && !filas[0],
    ultima: ultimas[0] ?? null,
    niveles: NIVELES,
  };
}

/**
 * Guarda la lectura del tramo actual. Responder dos veces corrige la anterior
 * en lugar de duplicarla: en sala se equivoca uno de boton y lo normal es que
 * vuelva a pulsar.
 */
export async function registrar(restauranteId, usuarioId, { nivel, comensales, nota }) {
  const ahora = new Date();
  const tramo = tramoActual(ahora);
  const local = ahoraEnCanarias(ahora);

  await pool.execute(
    `INSERT INTO ocupacion
       (restaurante_id, usuario_id, tramo, hora_local, dia_semana, nivel, comensales, nota)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       usuario_id = VALUES(usuario_id),
       nivel      = VALUES(nivel),
       comensales = VALUES(comensales),
       nota       = VALUES(nota)`,
    [
      restauranteId,
      usuarioId,
      aMySQL(tramo),
      Math.floor(local.minutos / 60),
      local.dia,
      nivel,
      comensales ?? null,
      nota ?? null,
    ]
  );

  return pendiente(restauranteId);
}

/** Ultimas lecturas, para la tabla del panel. */
export async function historico(restauranteId, dias = 14) {
  const [filas] = await pool.execute(
    `SELECT o.id, o.tramo, o.hora_local, o.dia_semana, o.nivel, o.comensales, o.nota,
            u.nombre AS usuario_nombre
       FROM ocupacion o
       LEFT JOIN usuarios u ON u.id = o.usuario_id
      WHERE o.restaurante_id = ? AND o.tramo >= NOW() - INTERVAL ? DAY
      ORDER BY o.tramo DESC
      LIMIT 500`,
    [restauranteId, dias]
  );
  return filas;
}

/**
 * Media de ocupacion por dia de la semana y hora.
 *
 * Es el dato que hoy no existe en ninguna parte: a que hora se llena de verdad
 * cada casa, para cuadrar turnos y compras.
 */
export async function patron(restauranteId, dias = 90) {
  const [filas] = await pool.execute(
    `SELECT dia_semana, hora_local,
            ROUND(AVG(nivel), 2) AS media,
            MAX(nivel) AS maximo,
            COUNT(*) AS lecturas
       FROM ocupacion
      WHERE restaurante_id = ? AND tramo >= NOW() - INTERVAL ? DAY
      GROUP BY dia_semana, hora_local
      ORDER BY dia_semana, hora_local`,
    [restauranteId, dias]
  );

  const [[resumen]] = await pool.execute(
    `SELECT COUNT(*) AS lecturas,
            ROUND(AVG(nivel), 2) AS media,
            MIN(tramo) AS desde
       FROM ocupacion
      WHERE restaurante_id = ? AND tramo >= NOW() - INTERVAL ? DAY`,
    [restauranteId, dias]
  );

  return {
    dias,
    resumen: {
      lecturas: Number(resumen.lecturas),
      media: resumen.media === null ? null : Number(resumen.media),
      desde: resumen.desde,
    },
    celdas: filas.map((f) => ({
      dia_semana: Number(f.dia_semana),
      hora: Number(f.hora_local),
      media: Number(f.media),
      maximo: Number(f.maximo),
      lecturas: Number(f.lecturas),
    })),
  };
}
