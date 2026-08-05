import * as usuarios from '../services/usuarios.service.js';

export async function getUsuarios(req, res) {
  res.json({ datos: await usuarios.listar() });
}

export async function getUsuario(req, res) {
  res.json({ datos: await usuarios.obtener(Number(req.params.id)) });
}

export async function postUsuario(req, res) {
  res.status(201).json({ datos: await usuarios.crear(req.body) });
}

export async function patchUsuario(req, res) {
  const datos = await usuarios.actualizar(Number(req.params.id), req.body, req.usuario);
  res.json({ datos });
}

export async function deleteUsuario(req, res) {
  res.json({ datos: await usuarios.desactivar(Number(req.params.id), req.usuario) });
}
