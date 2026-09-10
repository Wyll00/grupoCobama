import { estadisticasDeReservas } from '../services/estadisticasReservas.service.js';

/**
 * Cuantas reservas entran y por donde.
 *
 * El alcance sale del token, no de la peticion: un encargado ve las de su
 * casa y un admin de grupo las de las cuatro. Si viniera por parametro,
 * cualquiera podria pedir las de otro local cambiando un numero en la barra
 * de direcciones.
 */
export async function getEstadisticasReservas(req, res) {
  const meses = Math.min(Math.max(Number(req.query.meses) || 12, 1), 36);
  res.json({ datos: await estadisticasDeReservas(req.usuario.restaurante_id ?? null, meses) });
}
