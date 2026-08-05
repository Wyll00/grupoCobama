import * as categorias from '../services/categorias.service.js';

export async function getCategorias(req, res) {
  res.json({ datos: await categorias.listar() });
}

export async function postCategoria(req, res) {
  res.status(201).json({ datos: await categorias.crear(req.body) });
}

export async function patchCategoria(req, res) {
  res.json({ datos: await categorias.actualizar(Number(req.params.id), req.body) });
}

export async function deleteCategoria(req, res) {
  res.json({ datos: await categorias.eliminar(Number(req.params.id)) });
}

export async function putOrdenCategorias(req, res) {
  res.json({ datos: await categorias.reordenar(req.body.orden) });
}
