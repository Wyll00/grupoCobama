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

  const porClave = new Map(
    filas.map((f) => [
      f.mes,
      {
        mes: f.mes,
        total: Number(f.total),
        web: Number(f.web),
        whatsapp: Number(f.whatsapp),
        telefono: Number(f.telefono),
        comensales: Number(f.comensales ?? 0),
        comensalesWeb: Number(f.comensales_web ?? 0),
      },
    ])
  );

  /*
    Los meses SIN reservas salen igual, en cero.

    Con solo los que tienen algo, un mes suelto se pinta como una barra al
    100% y parece que ese mes fue un exito. Un mes a cero es un dato -no vino
    nadie- y hay que poder verlo: es la diferencia entre una linea de tiempo y
    una lista de los meses buenos.

    Se rellenan desde hace `meses` hasta hoy. Los que vengan despues -hay
    reservas para fechas futuras- se quedan como esten, sin inventar meses por
    delante.
  */
  const vacio = (clave) => ({
    mes: clave, total: 0, web: 0, whatsapp: 0, telefono: 0, comensales: 0, comensalesWeb: 0,
  });

  const hoy = new Date();
  const serie = [];
  for (let i = meses - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i, 1));
    const clave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    serie.push(porClave.get(clave) ?? vacio(clave));
    porClave.delete(clave);
  }
  /*
    Se quitan los meses vacios de ANTES de la primera reserva.

    Con doce meses fijos, una web que lleva dos meses funcionando salia con
    diez barras a cero delante. Eso no es un dato: es el tiempo en el que la
    web no existia, y llena la pantalla de nada.

    Los ceros de DENTRO se quedan -un mes sin reservas teniendo la web abierta
    si es un dato- y siempre se ensenan al menos seis meses, para que la
    grafica tenga forma de linea de tiempo desde el primer dia.
  */
  const MINIMO_MESES = 6;
  const primeroConDatos = serie.findIndex((m) => m.total > 0);
  const desde =
    primeroConDatos === -1
      ? Math.max(0, serie.length - MINIMO_MESES)
      : Math.min(primeroConDatos, Math.max(0, serie.length - MINIMO_MESES));

  // Y lo que caiga fuera del rango -reservas para mas adelante- detras.
  return [
    ...serie.slice(desde),
    ...[...porClave.values()].sort((a, b) => a.mes.localeCompare(b.mes)),
  ];
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
  /*
    El total va aqui dentro y CUENTA LAS CANCELADAS.

    El titular de la pagina no las cuenta -son mesas que no se ocupan-, asi
    que los dos numeros no coinciden y no tienen por que: uno dice cuanta
    gente viene y el otro en que acaba lo que se pide. Pero sin este total la
    pantalla se contradecia sola: arriba 4 y abajo cuatro cifras que sumaban
    5, sin nada que explicara la diferencia.
  */
  fuera.total = Object.values(fuera).reduce((n, v) => n + v, 0);
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
