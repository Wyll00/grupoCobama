import { pool } from '../config/db.js';

/**
 * Cuantas reservas entran, y por donde.
 *
 * La pregunta que contesta es una y muy concreta: de todo lo que se reserva
 * en el grupo, cuanto viene de la web. Es lo que justifica que la web exista,
 * y hasta ahora no habia forma de saberlo sin contar filas a mano.
 *
 * Todo sale de la tabla `reservas`, que ya guarda `origen` -web, whatsapp o
 * telefono- desde el principio. No hace falta ninguna columna nueva ni ningun
 * contador aparte: los contadores se desincronizan, las filas no.
 *
 * Se cuenta por FECHA DE LA RESERVA y no por cuando se pidio. Lo que le
 * interesa a una casa es cuanta gente se sento en marzo, no cuanta escribio
 * en marzo para venir en abril.
 */

/** Reservas y comensales por mes, separando de donde vienen. */
async function porMes(restauranteId, meses) {
  const [filas] = await pool.query(
    `SELECT DATE_FORMAT(fecha, '%Y-%m')                    AS mes,
            COUNT(*)                                        AS total,
            SUM(origen = 'web')                             AS web,
            SUM(origen = 'whatsapp')                        AS whatsapp,
            SUM(origen = 'telefono')                        AS telefono,
            SUM(comensales)                                 AS comensales,
            SUM(IF(origen = 'web', comensales, 0))          AS comensales_web
       FROM reservas
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        ${restauranteId ? 'AND restaurante_id = ?' : ''}
        AND estado <> 'cancelada'
      GROUP BY mes
      ORDER BY mes`,
    restauranteId ? [meses, restauranteId] : [meses]
  );

  return filas.map((f) => ({
    mes: f.mes,
    total: Number(f.total),
    web: Number(f.web),
    whatsapp: Number(f.whatsapp),
    telefono: Number(f.telefono),
    comensales: Number(f.comensales ?? 0),
    comensalesWeb: Number(f.comensales_web ?? 0),
  }));
}

/** El reparto por local, para ver que casa tira mas de la web. */
async function porLocal(meses) {
  const [filas] = await pool.query(
    `SELECT r.slug, r.nombre,
            COUNT(v.id)                             AS total,
            SUM(v.origen = 'web')                   AS web,
            SUM(IF(v.origen = 'web', v.comensales, 0)) AS comensales_web
       FROM restaurantes r
       LEFT JOIN reservas v
              ON v.restaurante_id = r.id
             AND v.estado <> 'cancelada'
             AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      WHERE r.activo = 1
      GROUP BY r.id, r.slug, r.nombre
      ORDER BY r.orden, r.nombre`,
    [meses]
  );

  return filas.map((f) => ({
    slug: f.slug,
    nombre: f.nombre,
    total: Number(f.total),
    web: Number(f.web),
    comensalesWeb: Number(f.comensales_web ?? 0),
  }));
}

/**
 * Como acaban las reservas que entran por la web.
 *
 * Sirve para saber si la web trae gente o trae ruido: una web que genera
 * muchas reservas y muchos "no presentado" no esta funcionando, esta
 * ocupando mesas.
 */
async function comoAcaban(restauranteId, meses) {
  const [filas] = await pool.query(
    `SELECT estado, COUNT(*) AS n
       FROM reservas
      WHERE origen = 'web'
        AND fecha >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        ${restauranteId ? 'AND restaurante_id = ?' : ''}
      GROUP BY estado`,
    restauranteId ? [meses, restauranteId] : [meses]
  );

  const fuera = { pendiente: 0, confirmada: 0, cancelada: 0, no_presentado: 0 };
  for (const f of filas) fuera[f.estado] = Number(f.n);
  return fuera;
}

/** Las horas a las que la gente reserva por la web. */
async function porHora(restauranteId, meses) {
  const [filas] = await pool.query(
    `SELECT HOUR(hora) AS h, COUNT(*) AS n
       FROM reservas
      WHERE origen = 'web'
        AND estado <> 'cancelada'
        AND fecha >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        ${restauranteId ? 'AND restaurante_id = ?' : ''}
      GROUP BY h
      ORDER BY h`,
    restauranteId ? [meses, restauranteId] : [meses]
  );
  return filas.map((f) => ({ hora: Number(f.h), n: Number(f.n) }));
}

/**
 * @param restauranteId  null para el grupo entero; un id para una casa.
 * @param meses          cuantos meses hacia atras se miran.
 */
export async function estadisticasDeReservas(restauranteId = null, meses = 12) {
  const [mes, locales, acaban, horas] = await Promise.all([
    porMes(restauranteId, meses),
    restauranteId ? Promise.resolve([]) : porLocal(meses),
    comoAcaban(restauranteId, meses),
    porHora(restauranteId, meses),
  ]);

  const suma = (campo) => mes.reduce((n, m) => n + m[campo], 0);
  const total = suma('total');
  const web = suma('web');

  return {
    meses,
    // Lo que se venia a saber, en una linea.
    resumen: {
      total,
      web,
      whatsapp: suma('whatsapp'),
      telefono: suma('telefono'),
      // Sin reservas todavia, el porcentaje es null y no 0: son cosas
      // distintas, y un 0% grande en la pantalla el primer dia parece que la
      // web no funciona cuando lo que pasa es que no ha entrado nadie aun.
      porcentajeWeb: total > 0 ? Math.round((web / total) * 100) : null,
      comensalesWeb: suma('comensalesWeb'),
    },
    porMes: mes,
    porLocal: locales,
    comoAcaban: acaban,
    porHora: horas,
  };
}
