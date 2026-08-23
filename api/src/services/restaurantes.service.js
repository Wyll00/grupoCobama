import { pool } from '../config/db.js';
import { estaAbiertoAhora, resumirHorarios } from '../utils/horarios.js';

const CAMPOS_LISTADO = `
  r.id, r.slug, r.nombre, r.municipio, r.direccion, r.telefono, r.email,
  r.whatsapp, r.lat, r.lng, r.reclamo, r.reclamo_en, r.imagen_portada, r.imagen_portada_movil, r.portada_clara,
  r.tiene_parking, r.orden, r.url_reservas
`;

export async function listarRestaurantes() {
  const [restaurantes] = await pool.execute(
    `SELECT ${CAMPOS_LISTADO}
       FROM restaurantes r
      WHERE r.activo = 1
      ORDER BY r.orden, r.nombre`
  );

  if (restaurantes.length === 0) return [];

  const [horarios] = await pool.execute(
    `SELECT restaurante_id, dia_semana, hora_apertura, hora_cierre, cerrado
       FROM horarios
      ORDER BY restaurante_id, dia_semana`
  );

  const porLocal = new Map();
  for (const h of horarios) {
    if (!porLocal.has(h.restaurante_id)) porLocal.set(h.restaurante_id, []);
    porLocal.get(h.restaurante_id).push(h);
  }

  return restaurantes.map((r) => {
    const suyos = porLocal.get(r.id) ?? [];
    return {
      ...normalizar(r),
      abierto_ahora: estaAbiertoAhora(suyos),
      horarios: resumirHorarios(suyos),
    };
  });
}

export async function obtenerRestaurantePorSlug(slug) {
  const [filas] = await pool.execute(
    `SELECT ${CAMPOS_LISTADO}, r.descripcion, r.descripcion_en
       FROM restaurantes r
      WHERE r.slug = ? AND r.activo = 1
      LIMIT 1`,
    [slug]
  );

  const restaurante = filas[0];
  if (!restaurante) return null;

  const [horarios] = await pool.execute(
    `SELECT dia_semana, hora_apertura, hora_cierre, cerrado
       FROM horarios
      WHERE restaurante_id = ?
      ORDER BY dia_semana`,
    [restaurante.id]
  );

  const [menus] = await pool.execute(
    `SELECT id, nombre, nombre_en, descripcion, descripcion_en,
            precio_por_persona, minimo_comensales
       FROM menus_grupo
      WHERE restaurante_id = ? AND activo = 1
      ORDER BY precio_por_persona`,
    [restaurante.id]
  );

  return {
    ...normalizar(restaurante),
    abierto_ahora: estaAbiertoAhora(horarios),
    horarios: resumirHorarios(horarios),
    horarios_detalle: horarios,
    menus_grupo: menus,
  };
}

/** Solo el id, para las rutas que cuelgan de un local. */
export async function obtenerIdPorSlug(slug) {
  const [filas] = await pool.execute(
    'SELECT id FROM restaurantes WHERE slug = ? AND activo = 1 LIMIT 1',
    [slug]
  );
  return filas[0]?.id ?? null;
}

function normalizar(r) {
  return {
    ...r,
    tiene_parking: Boolean(r.tiene_parking),
    portada_clara: Boolean(r.portada_clara),
    lat: r.lat === null ? null : Number(r.lat),
    lng: r.lng === null ? null : Number(r.lng),
  };
}
