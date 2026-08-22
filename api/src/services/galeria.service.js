import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { borrarImagenGaleria } from './imagenes.service.js';

const SELECT_FOTO = `
  SELECT g.id, g.restaurante_id, g.categoria, g.imagen, g.imagen_thumb,
         g.ancho, g.alto, g.titulo, g.alt, g.orden, g.activo,
         g.created_at, g.updated_at,
         r.nombre AS restaurante_nombre, r.slug AS restaurante_slug
    FROM galeria g
    LEFT JOIN restaurantes r ON r.id = g.restaurante_id
`;

const normalizar = (f) => ({
  ...f,
  activo: Boolean(f.activo),
  ancho: Number(f.ancho),
  alto: Number(f.alto),
});

/**
 * Galeria publica.
 *
 * `slug` null = la del grupo. Y la del grupo NO es solo lo que no tiene
 * local: es todo. Una galeria general que enseñara unicamente las cuatro
 * fotos sueltas del grupo y ninguna de las casas seria una galeria vacia con
 * mas pasos.
 */
export async function listarPublica({ slug = null, categoria = null } = {}) {
  const condiciones = ['g.activo = 1'];
  const valores = [];

  if (slug) {
    // La foto del grupo tambien sale en la casa: son fotos del sitio, y en la
    // ficha de un local lo que quiere ver alguien es ambiente, no una
    // clasificacion interna nuestra.
    condiciones.push('(r.slug = ? OR g.restaurante_id IS NULL)');
    valores.push(slug);
  }

  if (categoria) {
    condiciones.push('g.categoria = ?');
    valores.push(categoria);
  }

  const [filas] = await pool.execute(
    `${SELECT_FOTO} WHERE ${condiciones.join(' AND ')}
      ORDER BY g.orden, g.id DESC`,
    valores
  );

  return filas.map(normalizar);
}

/** Cuantas hay de cada categoria, para pintar los filtros sin adivinar. */
export async function contarPorCategoria(slug = null) {
  const [filas] = await pool.execute(
    `SELECT g.categoria, COUNT(*) AS total
       FROM galeria g
       LEFT JOIN restaurantes r ON r.id = g.restaurante_id
      WHERE g.activo = 1 ${slug ? 'AND (r.slug = ? OR g.restaurante_id IS NULL)' : ''}
      GROUP BY g.categoria`,
    slug ? [slug] : []
  );
  return Object.fromEntries(filas.map((f) => [f.categoria, Number(f.total)]));
}

// --------------------------------------------------------------- admin ---

/**
 * Listado del panel.
 *
 * `ambito` es 'grupo' o el id de un local. Antes esto recibia restauranteId y
 * trataba null como "sin filtro", con lo que la galeria del grupo enseñaba
 * TODAS las fotos, tambien las de las cuatro casas. Son dos cosas distintas
 * y con null no se pueden distinguir, asi que va por un valor explicito.
 *
 * Aqui NO se mezclan las del grupo con las del local, al reves que en la
 * publica: el panel es para gestionar, y ensenar fotos que no se pueden
 * tocar solo confunde sobre de quien es cada una.
 */
export async function listarAdmin({ ambito }) {
  const esGrupo = ambito === 'grupo';

  const [filas] = await pool.execute(
    `${SELECT_FOTO}
      WHERE ${esGrupo ? 'g.restaurante_id IS NULL' : 'g.restaurante_id = ?'}
      ORDER BY g.orden, g.id DESC`,
    esGrupo ? [] : [Number(ambito)]
  );
  return filas.map(normalizar);
}

export async function obtener(id) {
  const [filas] = await pool.execute(`${SELECT_FOTO} WHERE g.id = ? LIMIT 1`, [id]);
  if (!filas[0]) throw ApiError.noEncontrado('Esa foto no existe');
  return normalizar(filas[0]);
}

export async function crear({ restauranteId, categoria, imagen, thumb, ancho, alto, titulo, alt }) {
  // Al final del todo: una foto nueva no puede colarse delante de las que ya
  // estan ordenadas a mano.
  const [[{ siguiente }]] = await pool.execute(
    `SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM galeria
      WHERE restaurante_id <=> ?`,
    [restauranteId]
  );

  const [res] = await pool.execute(
    `INSERT INTO galeria
       (restaurante_id, categoria, imagen, imagen_thumb, ancho, alto, titulo, alt, orden)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [restauranteId, categoria, imagen, thumb, ancho, alto, titulo ?? null, alt ?? null, siguiente]
  );

  return obtener(res.insertId);
}

export async function actualizar(id, campos) {
  const permitidos = ['categoria', 'titulo', 'alt', 'activo'];
  const trozos = [];
  const valores = [];

  for (const campo of permitidos) {
    if (campos[campo] !== undefined) {
      trozos.push(`${campo} = ?`);
      valores.push(campos[campo]);
    }
  }
  if (trozos.length === 0) throw ApiError.peticionInvalida('No hay ningun cambio que aplicar');

  valores.push(id);
  const [res] = await pool.execute(`UPDATE galeria SET ${trozos.join(', ')} WHERE id = ?`, valores);
  if (res.affectedRows === 0) throw ApiError.noEncontrado('Esa foto no existe');

  return obtener(id);
}

/**
 * Borra la foto de verdad, tambien de disco.
 *
 * Aqui SI se borra y no se desactiva, al reves que con los platos. Un plato
 * desactivado guarda historico (precios, reservas que lo incluian); una foto
 * no cuenta nada, y dejar los ficheros ocupando disco para siempre no
 * beneficia a nadie. Para esconderla sin perderla ya esta `activo`.
 */
export async function borrar(id) {
  const foto = await obtener(id);
  await pool.execute('DELETE FROM galeria WHERE id = ?', [id]);
  // Los ficheros DESPUES de que la fila se haya ido: si el borrado falla, es
  // preferible un fichero huerfano en disco que una fila apuntando a una
  // imagen que ya no existe y un hueco roto en la galeria.
  await borrarImagenGaleria(foto.imagen, foto.imagen_thumb);
  return { borrada: true, id };
}

/**
 * Reordena. Se recibe la lista completa de ids en el orden nuevo.
 *
 * En una transaccion y comprobando antes que todos los ids son del ambito que
 * toca: si uno no lo es, no se aplica nada. Un reorden a medias deja la
 * galeria en un estado que nadie pidio y que no se sabe deshacer.
 */
export async function reordenar(ids, { restauranteId = null } = {}) {
  if (ids.length === 0) return { reordenadas: 0 };

  const huecos = ids.map(() => '?').join(', ');
  const [filas] = await pool.execute(
    `SELECT id FROM galeria WHERE id IN (${huecos}) AND restaurante_id <=> ?`,
    [...ids, restauranteId]
  );

  if (filas.length !== ids.length) {
    throw ApiError.peticionInvalida('Alguna de las fotos no es de esta galeria');
  }

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    for (let i = 0; i < ids.length; i += 1) {
      await conexion.execute('UPDATE galeria SET orden = ? WHERE id = ?', [i + 1, ids[i]]);
    }
    await conexion.commit();
  } catch (e) {
    await conexion.rollback();
    throw e;
  } finally {
    conexion.release();
  }

  return { reordenadas: ids.length };
}
