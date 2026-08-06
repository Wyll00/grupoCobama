import { randomInt } from 'node:crypto';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import {
  ahoraEnCanarias,
  hoyEnCanarias,
  diaSemanaDeFecha,
  horaAMinutos,
  minutosAHora,
  formatearHora,
} from '../utils/horarios.js';

/**
 * Ultima hora a la que se sienta a alguien antes de cerrar. Nadie acepta una
 * reserva para cinco minutos antes del cierre, y dejarlo pasar solo genera un
 * plante en la puerta.
 */
const MARGEN_CIERRE_MINUTOS = 45;

/**
 * Antelacion minima para una reserva por web. La reserva llega como solicitud
 * y alguien tiene que confirmarla: para dentro de diez minutos no da tiempo.
 * El alta manual desde el panel no pasa por aqui, porque quien la mete esta
 * hablando con el cliente y ya sabe si cabe.
 */
const ANTELACION_MINIMA_MINUTOS = 60;

const DIAS_MAXIMOS = 90;

// Sin 0/O ni 1/I/L: el codigo se dicta por telefono y se lee de un movil.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generarCodigo() {
  let codigo = '';
  for (let i = 0; i < 6; i++) codigo += ALFABETO[randomInt(ALFABETO.length)];
  return codigo;
}

const SELECT_RESERVA = `
  SELECT r.id, r.codigo, r.restaurante_id, r.nombre, r.telefono, r.email,
         r.fecha, r.hora, r.comensales, r.observaciones, r.notas_internas,
         r.estado, r.origen, r.created_at, r.updated_at,
         re.nombre AS restaurante_nombre, re.slug AS restaurante_slug,
         u.nombre AS usuario_nombre
    FROM reservas r
    JOIN restaurantes re ON re.id = r.restaurante_id
    LEFT JOIN usuarios u ON u.id = r.usuario_id
`;

/**
 * Comprueba que la fecha y la hora caen dentro del horario real del local.
 *
 * Es la validacion que evita el caso tonto: alguien reserva para las once de
 * la manana un lunes y en sala se encuentran con un cliente en la puerta
 * cuando todavia no han abierto.
 */
export async function comprobarHorario(restauranteId, fecha, hora, { esManual = false } = {}) {
  const hoy = hoyEnCanarias();

  if (fecha < hoy) {
    throw ApiError.peticionInvalida('Esa fecha ya ha pasado');
  }

  const limite = new Date(`${hoy}T00:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() + DIAS_MAXIMOS);
  if (fecha > limite.toISOString().slice(0, 10)) {
    throw ApiError.peticionInvalida(
      `Solo se puede reservar con ${DIAS_MAXIMOS} dias de antelacion. Para mas adelante, llama al local.`
    );
  }

  const dia = diaSemanaDeFecha(fecha);
  const [filas] = await pool.execute(
    `SELECT hora_apertura, hora_cierre, cerrado
       FROM horarios WHERE restaurante_id = ? AND dia_semana = ? LIMIT 1`,
    [restauranteId, dia]
  );

  const horario = filas[0];
  if (!horario || horario.cerrado) {
    throw ApiError.peticionInvalida('Ese dia el local esta cerrado');
  }

  const minutos = horaAMinutos(hora);
  const apertura = horaAMinutos(horario.hora_apertura);
  const cierre = horaAMinutos(horario.hora_cierre);
  const ultimaMesa = cierre - MARGEN_CIERRE_MINUTOS;

  if (minutos < apertura || minutos > ultimaMesa) {
    throw ApiError.peticionInvalida(
      `Ese dia se sienta de ${formatearHora(horario.hora_apertura)} a ${minutosAHora(ultimaMesa)}`
    );
  }

  if (!esManual && fecha === hoy) {
    const ahora = ahoraEnCanarias();
    if (minutos < ahora.minutos + ANTELACION_MINIMA_MINUTOS) {
      throw ApiError.peticionInvalida(
        'Para hoy dentro de menos de una hora, mejor llama al local directamente'
      );
    }
  }

  return { apertura: horario.hora_apertura, cierre: horario.hora_cierre };
}

/** Horas a las que se puede reservar un dia concreto, en tramos de 15 min. */
export async function tramosDisponibles(restauranteId, fecha) {
  const dia = diaSemanaDeFecha(fecha);
  const [filas] = await pool.execute(
    `SELECT hora_apertura, hora_cierre, cerrado
       FROM horarios WHERE restaurante_id = ? AND dia_semana = ? LIMIT 1`,
    [restauranteId, dia]
  );

  const horario = filas[0];
  if (!horario || horario.cerrado) return { cerrado: true, tramos: [] };

  const apertura = horaAMinutos(horario.hora_apertura);
  const ultima = horaAMinutos(horario.hora_cierre) - MARGEN_CIERRE_MINUTOS;

  const hoy = hoyEnCanarias();
  const desde =
    fecha === hoy
      ? Math.max(apertura, ahoraEnCanarias().minutos + ANTELACION_MINIMA_MINUTOS)
      : apertura;

  const tramos = [];
  // Se redondea al cuarto de hora siguiente para no ofrecer las 13:07.
  for (let m = Math.ceil(desde / 15) * 15; m <= ultima; m += 15) {
    tramos.push(minutosAHora(m));
  }

  return { cerrado: false, tramos };
}

async function conCodigoUnico(insertar) {
  // El codigo es aleatorio de 31^6, asi que chocar es raro, pero el indice es
  // unico y un choque tiene que reintentarse en lugar de reventar la reserva.
  for (let intento = 0; intento < 5; intento++) {
    try {
      return await insertar(generarCodigo());
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') throw err;
    }
  }
  throw new Error('No se ha podido generar un codigo de reserva unico');
}

export async function crear(datos, { origen = 'web', usuarioId = null, esManual = false } = {}) {
  const [local] = await pool.execute(
    'SELECT id, nombre FROM restaurantes WHERE id = ? AND activo = 1 LIMIT 1',
    [datos.restaurante_id]
  );
  if (local.length === 0) throw ApiError.peticionInvalida('Ese local no existe');

  await comprobarHorario(datos.restaurante_id, datos.fecha, datos.hora, { esManual });

  const id = await conCodigoUnico(async (codigo) => {
    const [res] = await pool.execute(
      `INSERT INTO reservas
         (codigo, restaurante_id, nombre, telefono, email, fecha, hora,
          comensales, observaciones, notas_internas, estado, origen, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
        datos.restaurante_id,
        datos.nombre,
        datos.telefono,
        datos.email ?? null,
        datos.fecha,
        datos.hora,
        datos.comensales,
        datos.observaciones ?? null,
        datos.notas_internas ?? null,
        // Lo que mete sala hablando con el cliente ya esta confirmado; lo que
        // llega por web es una solicitud hasta que alguien la mire.
        esManual ? 'confirmada' : 'pendiente',
        origen,
        usuarioId,
      ]
    );
    return res.insertId;
  });

  return obtener(id);
}

export async function obtener(id) {
  const [filas] = await pool.execute(`${SELECT_RESERVA} WHERE r.id = ? LIMIT 1`, [id]);
  if (!filas[0]) throw ApiError.noEncontrado('Esa reserva no existe');
  return filas[0];
}

export async function listar(restauranteId, { desde, hasta, estado, q }) {
  const where = ['r.restaurante_id = ?'];
  const params = [restauranteId];

  if (desde) {
    where.push('r.fecha >= ?');
    params.push(desde);
  }
  if (hasta) {
    where.push('r.fecha <= ?');
    params.push(hasta);
  }
  if (estado && estado !== 'todas') {
    where.push('r.estado = ?');
    params.push(estado);
  }
  if (q) {
    where.push('(r.nombre LIKE ? OR r.telefono LIKE ? OR r.codigo = ?)');
    params.push(`%${q}%`, `%${q}%`, q.toUpperCase());
  }

  const [filas] = await pool.execute(
    `${SELECT_RESERVA} WHERE ${where.join(' AND ')} ORDER BY r.fecha, r.hora, r.id LIMIT 300`,
    params
  );
  return filas;
}

/** Cuantas reservas y cuantos comensales hay por estado en un dia. */
export async function resumenDia(restauranteId, fecha) {
  const [filas] = await pool.execute(
    `SELECT estado, COUNT(*) AS reservas, SUM(comensales) AS comensales
       FROM reservas
      WHERE restaurante_id = ? AND fecha = ?
      GROUP BY estado`,
    [restauranteId, fecha]
  );

  const resumen = { pendiente: 0, confirmada: 0, cancelada: 0, no_presentado: 0 };
  const comensales = { ...resumen };
  for (const f of filas) {
    resumen[f.estado] = Number(f.reservas);
    comensales[f.estado] = Number(f.comensales);
  }

  return {
    fecha,
    reservas: resumen,
    comensales,
    // Los que de verdad van a sentarse: pendientes mas confirmadas.
    comensales_esperados: comensales.pendiente + comensales.confirmada,
  };
}

export async function actualizar(id, cambios, usuarioId) {
  const actual = await obtener(id);

  // Si se mueve la fecha o la hora, hay que volver a validar el horario: si no,
  // desde el panel se podria colocar una reserva un lunes cerrado.
  if (cambios.fecha || cambios.hora) {
    await comprobarHorario(
      actual.restaurante_id,
      cambios.fecha ?? actual.fecha,
      cambios.hora ?? actual.hora,
      { esManual: true }
    );
  }

  const columnas = [];
  const valores = [];
  for (const campo of [
    'nombre', 'telefono', 'email', 'fecha', 'hora', 'comensales',
    'observaciones', 'notas_internas', 'estado',
  ]) {
    if (cambios[campo] !== undefined) {
      columnas.push(`${campo} = ?`);
      valores.push(cambios[campo]);
    }
  }

  if (columnas.length === 0) return actual;

  columnas.push('usuario_id = ?');
  valores.push(usuarioId);

  await pool.execute(`UPDATE reservas SET ${columnas.join(', ')} WHERE id = ?`, [...valores, id]);
  return obtener(id);
}

/** Reservas pendientes de mirar, para el aviso del panel. */
export async function pendientes(restauranteId) {
  const [[fila]] = await pool.execute(
    `SELECT COUNT(*) AS n FROM reservas
      WHERE restaurante_id = ? AND estado = 'pendiente' AND fecha >= ?`,
    [restauranteId, hoyEnCanarias()]
  );
  return Number(fila.n);
}
