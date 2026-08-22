import {
  listarRestaurantes,
  obtenerRestaurantePorSlug,
  obtenerIdPorSlug,
} from '../services/restaurantes.service.js';
import { obtenerCarta } from '../services/catalogo.service.js';
import * as galeria from '../services/galeria.service.js';
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

/**
 * Galeria publica. Sin slug es la del grupo; con slug, la de esa casa mas las
 * del grupo, que tambien son fotos de la casa.
 */
export async function getGaleria(req, res) {
  const slug = req.params.slug ?? null;

  if (slug) {
    // Que el local exista y este activo se comprueba antes de devolver fotos:
    // si no, /un-local-inventado/galeria responderia 200 con una lista vacia
    // en vez de un 404.
    const id = await obtenerIdPorSlug(slug);
    if (!id) throw ApiError.noEncontrado('Ese local no existe');
  }

  const [fotos, porCategoria] = await Promise.all([
    galeria.listarPublica({ slug, categoria: req.consulta?.categoria ?? null }),
    galeria.contarPorCategoria(slug),
  ]);

  // Todo dentro de `datos`, igual que la carta: el cliente de la web se queda
  // con ese campo y descarta el resto del sobre, asi que lo que salga fuera
  // no llega nunca.
  res.json({ datos: { total: fotos.length, fotos, categorias: porCategoria } });
}
