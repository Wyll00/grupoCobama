import { pool } from '../config/db.js';

export async function listarCategorias() {
  const [filas] = await pool.execute(
    `SELECT id, slug, nombre, nombre_en, orden
       FROM categorias
      WHERE activo = 1
      ORDER BY orden, nombre`
  );
  return filas;
}

export async function listarAlergenos() {
  const [filas] = await pool.execute(
    'SELECT id, slug, nombre, nombre_en, icono FROM alergenos ORDER BY id'
  );
  return filas;
}

/**
 * Carta de un local, agrupada por categoria.
 *
 * filtros:
 *   categoria     slug de categoria
 *   sinAlergenos  array de slugs de alergeno a excluir
 *   vegetariano   boolean
 *   vegano        boolean
 *   destacados    boolean
 *   busqueda      texto libre sobre nombre y descripcion
 */
export async function obtenerCarta(restauranteId, filtros = {}) {
  const where = [
    'ci.restaurante_id = ?',
    'ci.activo = 1',
    'p.activo = 1',
    'c.activo = 1',
  ];
  const params = [restauranteId];

  if (filtros.categoria) {
    where.push('c.slug = ?');
    params.push(filtros.categoria);
  }
  if (filtros.vegetariano) where.push('p.es_vegetariano = 1');
  if (filtros.vegano) where.push('p.es_vegano = 1');
  if (filtros.destacados) where.push('ci.destacado = 1');

  if (filtros.busqueda) {
    where.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)');
    const patron = `%${filtros.busqueda}%`;
    params.push(patron, patron);
  }

  if (filtros.sinAlergenos?.length) {
    const huecos = filtros.sinAlergenos.map(() => '?').join(', ');
    where.push(`NOT EXISTS (
      SELECT 1
        FROM plato_alergenos pa
        JOIN alergenos a ON a.id = pa.alergeno_id
       WHERE pa.plato_id = p.id AND a.slug IN (${huecos})
    )`);
    params.push(...filtros.sinAlergenos);
  }

  const [items] = await pool.execute(
    `SELECT ci.id           AS carta_item_id,
            ci.precio,
            ci.destacado,
            (ci.agotado_hasta IS NOT NULL AND ci.agotado_hasta > NOW()) AS agotado,
            p.id            AS plato_id,
            p.nombre, p.nombre_en, p.descripcion, p.descripcion_en, p.imagen,
            p.ancho_cm, p.modelo_glb,
            p.es_vegetariano, p.es_vegano,
            c.id            AS categoria_id,
            c.slug          AS categoria_slug,
            c.nombre        AS categoria_nombre,
            c.nombre_en     AS categoria_nombre_en
       FROM carta_items ci
       JOIN platos p     ON p.id = ci.plato_id
       JOIN categorias c ON c.id = p.categoria_id
      WHERE ${where.join(' AND ')}
      ORDER BY c.orden, ci.orden, p.nombre`,
    params
  );

  const alergenosPorPlato = await cargarAlergenos(items.map((i) => i.plato_id));

  // Agrupado por categoria conservando el orden que ya trae la consulta.
  const categorias = [];
  const indice = new Map();

  for (const item of items) {
    if (!indice.has(item.categoria_id)) {
      const categoria = {
        id: item.categoria_id,
        slug: item.categoria_slug,
        nombre: item.categoria_nombre,
        nombre_en: item.categoria_nombre_en,
        platos: [],
      };
      indice.set(item.categoria_id, categoria);
      categorias.push(categoria);
    }

    indice.get(item.categoria_id).platos.push({
      carta_item_id: item.carta_item_id,
      id: item.plato_id,
      nombre: item.nombre,
      nombre_en: item.nombre_en,
      descripcion: item.descripcion,
      descripcion_en: item.descripcion_en,
      imagen: item.imagen,
      ancho_cm: item.ancho_cm === null ? null : Number(item.ancho_cm),
      // La carta solo necesita saber SI se puede ver en la mesa; el modelo lo
      // pide luego el visor a /api/platos/:id/ar.
      ver_en_mesa: Boolean(item.modelo_glb || (item.imagen && item.ancho_cm)),
      precio: item.precio,
      destacado: Boolean(item.destacado),
      // Se sigue enseñando, marcado. Esconderlo haria que el cliente lo
      // pidiera igual porque lo vio ayer; verlo tachado le ahorra la pregunta
      // y a sala la explicacion.
      agotado: Boolean(item.agotado),
      es_vegetariano: Boolean(item.es_vegetariano),
      es_vegano: Boolean(item.es_vegano),
      alergenos: alergenosPorPlato.get(item.plato_id) ?? [],
    });
  }

  return { total: items.length, categorias };
}

async function cargarAlergenos(platoIds) {
  const mapa = new Map();
  if (platoIds.length === 0) return mapa;

  const huecos = platoIds.map(() => '?').join(', ');
  const [filas] = await pool.execute(
    `SELECT pa.plato_id, pa.trazas,
            a.id, a.slug, a.nombre, a.nombre_en, a.icono
       FROM plato_alergenos pa
       JOIN alergenos a ON a.id = pa.alergeno_id
      WHERE pa.plato_id IN (${huecos})
      ORDER BY a.id`,
    platoIds
  );

  for (const f of filas) {
    if (!mapa.has(f.plato_id)) mapa.set(f.plato_id, []);
    mapa.get(f.plato_id).push({
      id: f.id,
      slug: f.slug,
      nombre: f.nombre,
      nombre_en: f.nombre_en,
      icono: f.icono,
      trazas: Boolean(f.trazas),
    });
  }

  return mapa;
}
