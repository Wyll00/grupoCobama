import { pool } from '../config/db.js';
import { estaAbiertoAhora, resumirHorarios } from '../utils/horarios.js';

const CAMPOS_LISTADO = `
  r.id, r.slug, r.nombre, r.municipio, r.direccion, r.telefono, r.email,
  r.whatsapp, r.lat, r.lng, r.reclamo, r.reclamo_en, r.imagen_portada, r.imagen_portada_movil, r.portada_estilo,
  r.tiene_parking, r.orden, r.url_reservas,

  -- Cuantas fotos ensenaria SU galeria. Incluye las del grupo -las que no
  -- son de ningun local- porque la galeria de cada casa tambien las saca:
  -- misma condicion que galeria.service.js, para que el enlace no prometa
  -- una pagina vacia ni esconda una que tiene fotos.
  --
  -- Es para saber si el enlace se ensena, no para pintar un contador. Sale
  -- aqui y no en una peticion aparte porque la portada, el pie y la ficha ya
  -- piden estos datos: asi esconder los enlaces no cuesta ni una peticion
  -- mas. Cuando se suban fotos, los enlaces vuelven solos.
  (SELECT COUNT(*) FROM galeria g
    WHERE g.activo = 1
      AND (g.restaurante_id = r.id OR g.restaurante_id IS NULL)) AS fotos
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

  return {
    ...normalizar(restaurante),
    abierto_ahora: estaAbiertoAhora(horarios),
    horarios: resumirHorarios(horarios),
    horarios_detalle: horarios,
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
    fotos: Number(r.fotos ?? 0),
    tiene_parking: Boolean(r.tiene_parking),
    lat: r.lat === null ? null : Number(r.lat),
    lng: r.lng === null ? null : Number(r.lng),
  };
}
