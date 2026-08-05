import * as ocupacion from '../services/ocupacion.service.js';

export async function getPendiente(req, res) {
  res.json({ datos: await ocupacion.pendiente(req.restauranteId) });
}

export async function postOcupacion(req, res) {
  const datos = await ocupacion.registrar(req.restauranteId, req.usuario.id, req.body);
  res.status(201).json({ datos });
}

export async function getHistorico(req, res) {
  res.json({ datos: await ocupacion.historico(req.restauranteId, req.consulta.dias) });
}

export async function getPatron(req, res) {
  res.json({ datos: await ocupacion.patron(req.restauranteId, req.consulta.dias) });
}
