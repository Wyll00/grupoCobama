import * as carta from '../services/cartaAdmin.service.js';
import { generarQr } from '../services/qr.service.js';

export async function getCarta(req, res) {
  res.json({ datos: await carta.listar(req.restauranteId) });
}

export async function postPlatoNuevo(req, res) {
  res.status(201).json({ datos: await carta.crearYAnadir(req.restauranteId, req.body) });
}

export async function getQr(req, res) {
  res.json({ datos: await generarQr(req.restauranteId) });
}

export async function getDisponibles(req, res) {
  res.json({ datos: await carta.disponibles(req.restauranteId) });
}

export async function postItem(req, res) {
  res.status(201).json({ datos: await carta.anadir(req.restauranteId, req.body) });
}

export async function patchItem(req, res) {
  const datos = await carta.actualizar(Number(req.params.id), req.body, req.usuario.id);
  res.json({ datos });
}

export async function deleteItem(req, res) {
  res.json({ datos: await carta.desactivar(Number(req.params.id)) });
}

export async function putOrden(req, res) {
  res.json({ datos: await carta.reordenar(req.restauranteId, req.body.orden) });
}

export async function getHistorico(req, res) {
  res.json({ datos: await carta.historico(Number(req.params.id)) });
}
