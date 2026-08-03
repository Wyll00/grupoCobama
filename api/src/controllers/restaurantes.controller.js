import {
  listarRestaurantes,
  obtenerRestaurantePorSlug,
  obtenerIdPorSlug,
} from '../services/restaurantes.service.js';
import { obtenerCarta } from '../services/catalogo.service.js';
import { ApiError } from '../utils/ApiError.js';

export async function getRestaurantes(req, res) {
  res.json({ datos: await listarRestaurantes() });
}

export async function getRestaurante(req, res) {
  const restaurante = await obtenerRestaurantePorSlug(req.params.slug);
  if (!restaurante) {
    throw ApiError.noEncontrado(`No existe el local "${req.params.slug}"`);
  }
  res.json({ datos: restaurante });
}

export async function getCarta(req, res) {
  const restauranteId = await obtenerIdPorSlug(req.params.slug);
  if (!restauranteId) {
    throw ApiError.noEncontrado(`No existe el local "${req.params.slug}"`);
  }

  const filtros = {
    categoria: req.query.categoria?.trim() || undefined,
    sinAlergenos: listaDeQuery(req.query.sin_alergenos),
    vegetariano: esVerdadero(req.query.vegetariano),
    vegano: esVerdadero(req.query.vegano),
    destacados: esVerdadero(req.query.destacados),
    busqueda: req.query.q?.trim() || undefined,
  };

  const carta = await obtenerCarta(restauranteId, filtros);
  res.json({ datos: carta, filtros });
}

/** 'gluten,lacteos' -> ['gluten', 'lacteos'] */
function listaDeQuery(valor) {
  if (!valor) return [];
  return String(valor)
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

const esVerdadero = (v) => v === '1' || v === 'true';
