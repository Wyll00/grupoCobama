/**
 * Envio de reservas a CoverManager.
 *
 * Regla de oro: la reserva ya esta guardada aqui antes de que esto se ejecute.
 * Nada de lo que pase en este fichero puede hacer que una reserva se pierda ni
 * que el cliente reciba un error. Como mucho, se quedara sin enviar y alguien
 * lo vera en el panel.
 *
 * Por eso el envio no va dentro de la peticion del cliente: si su API tarda
 * ocho segundos, el cliente no tiene por que esperarlos, y si esta caida no
 * tiene por que enterarse.
 */
import { pool } from '../config/db.js';
import * as cm from '../integraciones/covermanager.js';

/**
 * Espera antes de cada reintento, en minutos.
 *
 * Creciente a proposito: si su API esta caida, insistir cada minuto no la
 * levanta y solo llena el log. El ultimo salto es de seis horas porque a
 * partir de ahi ya no es un fallo pasajero y tiene que mirarlo una persona.
 */
const ESPERAS_MINUTOS = [1, 5, 15, 60, 360];
const MAX_INTENTOS = ESPERAS_MINUTOS.length + 1;

/** Si un envio lleva mas de esto en curso, es que el proceso murio a medias. */
const MINUTOS_ATASCO = 10;

const SELECT_PARA_ENVIO = `
  SELECT r.id, r.codigo, r.nombre, r.telefono, r.email, r.fecha, r.hora,
         r.comensales, r.observaciones, r.cm_intentos,
         res.id AS local_id, res.nombre AS local_nombre, res.covermanager_id
    FROM reservas r
    JOIN restaurantes res ON res.id = r.restaurante_id
`;

/**
 * Deja la reserva lista para enviarse.
 *
 * Si el local no esta integrado o falta configuracion, queda en 'no_aplica':
 * no es un error ni algo que reintentar, simplemente ese local no usa
 * CoverManager. Distinguirlo importa, porque si no el panel ensenaria avisos
 * rojos permanentes en locales que nunca van a sincronizar.
 */
export async function marcarParaEnvio(reservaId) {
  if (!cm.estaConfigurado()) return 'no_aplica';

  const [filas] = await pool.execute(
    `SELECT res.covermanager_id
       FROM reservas r JOIN restaurantes res ON res.id = r.restaurante_id
      WHERE r.id = ?`,
    [reservaId]
  );
  if (filas.length === 0) return 'no_aplica';
  if (!filas[0].covermanager_id) return 'no_aplica';

  await pool.execute(
    `UPDATE reservas
        SET cm_estado = 'pendiente', cm_proximo_intento = NOW()
      WHERE id = ? AND cm_estado = 'no_aplica'`,
    [reservaId]
  );
  return 'pendiente';
}

/**
 * Intenta enviar una reserva concreta.
 *
 * Devuelve el estado en que queda. No lanza: quien llama suele ser un proceso
 * de fondo al que no le sirve de nada una excepcion.
 */
export async function intentarUna(reservaId) {
  // Reclamo atomico. Esto es lo que impide que dos pasadas del reintentador
  // (o dos instancias de la API) cojan la misma fila y manden la reserva dos
  // veces. Si affectedRows es 0, otro se la ha llevado y aqui no hay nada
  // que hacer.
  const [reclamo] = await pool.execute(
    `UPDATE reservas
        SET cm_estado = 'enviando', cm_intentos = cm_intentos + 1
      WHERE id = ?
        AND cm_estado IN ('pendiente', 'error')
        AND (cm_proximo_intento IS NULL OR cm_proximo_intento <= NOW())`,
    [reservaId]
  );
  if (reclamo.affectedRows === 0) return null;

  const [filas] = await pool.execute(`${SELECT_PARA_ENVIO} WHERE r.id = ?`, [reservaId]);
  const fila = filas[0];

  try {
    const { id } = await cm.enviarReserva({
      reserva: fila,
      local: { id: fila.local_id, nombre: fila.local_nombre, covermanager_id: fila.covermanager_id },
    });

    await pool.execute(
      `UPDATE reservas
          SET cm_estado = 'enviada', cm_id = ?, cm_enviada_en = NOW(),
              cm_ultimo_error = NULL, cm_proximo_intento = NULL
        WHERE id = ?`,
      [id, reservaId]
    );
    return 'enviada';
  } catch (e) {
    return await anotarFallo(reservaId, fila.cm_intentos + 1, e);
  }
}

async function anotarFallo(reservaId, intentos, error) {
  const esPermanente = error.permanente === true;
  const agotado = intentos >= MAX_INTENTOS;

  // Un error permanente no se reintenta: si han rechazado los datos o las
  // credenciales estan mal, mandarlo otras cinco veces da el mismo resultado.
  const proximo =
    esPermanente || agotado ? null : ESPERAS_MINUTOS[Math.min(intentos - 1, ESPERAS_MINUTOS.length - 1)];

  await pool.execute(
    `UPDATE reservas
        SET cm_estado = 'error',
            cm_ultimo_error = ?,
            cm_proximo_intento = ${proximo === null ? 'NULL' : 'DATE_ADD(NOW(), INTERVAL ? MINUTE)'}
      WHERE id = ?`,
    proximo === null
      ? [String(error.message).slice(0, 500), reservaId]
      : [String(error.message).slice(0, 500), proximo, reservaId]
  );

  return 'error';
}

/**
 * Devuelve a la cola lo que se quedo a medias.
 *
 * Si la API se reinicia justo mientras enviaba, esas filas se quedan en
 * 'enviando' para siempre y nadie las vuelve a mirar: el reclamo solo coge
 * 'pendiente' y 'error'. Esta es la unica forma de que salgan de ahi.
 */
async function desatascar() {
  const [res] = await pool.execute(
    `UPDATE reservas
        SET cm_estado = 'error',
            cm_ultimo_error = 'El envio se quedo a medias (reinicio de la API)',
            cm_proximo_intento = NOW()
      WHERE cm_estado = 'enviando'
        AND updated_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [MINUTOS_ATASCO]
  );
  return res.affectedRows;
}

/** Una pasada del reintentador. Devuelve el recuento de lo que ha hecho. */
export async function procesarPendientes({ limite = 20 } = {}) {
  if (!cm.estaConfigurado()) return { configurado: false };

  const desatascadas = await desatascar();

  const [filas] = await pool.execute(
    `SELECT id FROM reservas
      WHERE cm_estado IN ('pendiente', 'error')
        AND cm_proximo_intento IS NOT NULL
        AND cm_proximo_intento <= NOW()
      ORDER BY cm_proximo_intento
      LIMIT ${Number(limite)}`
  );

  const cuenta = { configurado: true, desatascadas, enviadas: 0, fallidas: 0, saltadas: 0 };

  for (const { id } of filas) {
    const estado = await intentarUna(id);
    if (estado === 'enviada') cuenta.enviadas += 1;
    else if (estado === 'error') cuenta.fallidas += 1;
    else cuenta.saltadas += 1;
  }

  return cuenta;
}

/**
 * Reintento a mano desde el panel.
 *
 * Limpia la espera y el contador: si alguien ha arreglado lo que fallaba,
 * no tiene sentido que siga esperando seis horas por los intentos de antes.
 */
export async function reintentar(reservaId) {
  await pool.execute(
    `UPDATE reservas
        SET cm_estado = 'pendiente', cm_intentos = 0,
            cm_proximo_intento = NOW(), cm_ultimo_error = NULL
      WHERE id = ? AND cm_estado IN ('error', 'pendiente')`,
    [reservaId]
  );
  return intentarUna(reservaId);
}
