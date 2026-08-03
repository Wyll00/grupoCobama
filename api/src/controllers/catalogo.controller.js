import { listarCategorias, listarAlergenos } from '../services/catalogo.service.js';

export async function getCategorias(req, res) {
  res.json({ datos: await listarCategorias() });
}

export async function getAlergenos(req, res) {
  res.json({ datos: await listarAlergenos() });
}
