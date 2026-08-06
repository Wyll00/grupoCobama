import { pool } from '../config/db.js';
import * as reservas from '../services/reservas.service.js';
import { avisarLocalDeReserva, avisarClienteDeReserva } from '../services/correo.service.js';

/** Publico: horas a las que se puede reservar un dia concreto. */
export async function getTramos(req, res) {
  const { restaurante_id: id, fecha } = req.consulta;
  res.json({ datos: await reservas.tramosDisponibles(id, fecha) });
}

/**
 * Publico: solicitud de reserva desde la web.
 *
 * Del cliente solo vuelve el codigo y lo justo para que sepa que ha entrado.
 * Nunca las notas internas ni el id, que son de la casa.
 */
export async function postReserva(req, res) {
  const reserva = await reservas.crear(req.body, { origen: 'web' });

  const [locales] = await pool.execute('SELECT email FROM restaurantes WHERE id = ?', [
    reserva.restaurante_id,
  ]);
  // Que falle el aviso no puede tumbar la reserva: ya esta guardada y sala la
  // vera igual en el panel.
  const aviso = await avisarLocalDeReserva(reserva, locales[0]?.email).catch((err) => {
    console.error('[reservas] no se ha podido avisar al local:', err.message);
    return { enviado: false };
  });

  res.status(201).json({
    datos: {
      codigo: reserva.codigo,
      estado: reserva.estado,
      restaurante: reserva.restaurante_nombre,
      fecha: reserva.fecha,
      hora: reserva.hora,
      comensales: reserva.comensales,
      avisado: aviso.enviado,
    },
  });
}

// --------------------------------------------------------------- panel ----

export async function getReservas(req, res) {
  res.json({ datos: await reservas.listar(req.restauranteId, req.consulta) });
}

export async function getResumen(req, res) {
  const fecha = req.consulta.desde ?? new Date().toISOString().slice(0, 10);
  res.json({ datos: await reservas.resumenDia(req.restauranteId, fecha) });
}

export async function postReservaManual(req, res) {
  const datos = await reservas.crear(
    { ...req.body, restaurante_id: req.restauranteId },
    { origen: req.body.origen, usuarioId: req.usuario.id, esManual: true }
  );
  res.status(201).json({ datos });
}

export async function patchReserva(req, res) {
  const antes = await reservas.obtener(Number(req.params.id));
  const despues = await reservas.actualizar(Number(req.params.id), req.body, req.usuario.id);

  // Solo se avisa al cliente cuando el estado cambia a algo que le importa.
  const cambioRelevante =
    antes.estado !== despues.estado &&
    ['confirmada', 'cancelada'].includes(despues.estado);

  let aviso = null;
  if (cambioRelevante) {
    aviso = await avisarClienteDeReserva(despues).catch((err) => {
      console.error('[reservas] no se ha podido avisar al cliente:', err.message);
      return { enviado: false };
    });
  }

  res.json({ datos: { ...despues, aviso } });
}
