import { pool, transaccion } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Carta completa de un local para el panel: incluye los platos desactivados,
 * al contrario que la carta publica.
 */
export async function listar(restauranteId) {
  const [filas] = await pool.execute(
    `SELECT ci.id, ci.plato_id, ci.precio, ci.activo, ci.orden, ci.destacado,
            p.nombre, p.imagen_thumb, p.activo AS plato_activo,
            c.id AS categoria_id, c.slug AS categoria_slug, c.nombre AS categoria_nombre
       FROM carta_items ci
       JOIN platos p     ON p.id = ci.plato_id
       JOIN categorias c ON c.id = p.categoria_id
      WHERE ci.restaurante_id = ?
      ORDER BY c.orden, ci.orden, p.nombre`,
    [restauranteId]
  );

  const categorias = [];
  const indice = new Map();

  for (const f of filas) {
    if (!indice.has(f.categoria_id)) {
      const categoria = {
        id: f.categoria_id,
        slug: f.categoria_slug,
        nombre: f.categoria_nombre,
        items: [],
      };
      indice.set(f.categoria_id, categoria);
      categorias.push(categoria);
    }
    indice.get(f.categoria_id).items.push({
      id: f.id,
      plato_id: f.plato_id,
      nombre: f.nombre,
      imagen_thumb: f.imagen_thumb,
      precio: f.precio,
      orden: f.orden,
      activo: Boolean(f.activo),
      destacado: Boolean(f.destacado),
      // Si el plato esta desactivado en el catalogo maestro, la linea de carta
      // no se puede reactivar hasta que cocina central lo reactive.
      plato_activo: Boolean(f.plato_activo),
    });
  }

  return { total: filas.length, categorias };
}

export async function anadir(restauranteId, { plato_id, precio, destacado, activo }) {
  const [plato] = await pool.execute('SELECT id, activo FROM platos WHERE id = ?', [plato_id]);
  if (plato.length === 0) throw ApiError.noEncontrado('Ese plato no existe en el catalogo');
  if (!plato[0].activo) {
    throw ApiError.peticionInvalida('Ese plato esta desactivado en el catalogo maestro');
  }

  const [existe] = await pool.execute(
    'SELECT id FROM carta_items WHERE restaurante_id = ? AND plato_id = ?',
    [restauranteId, plato_id]
  );
  if (existe.length > 0) {
    throw ApiError.conflicto('Ese plato ya esta en la carta de este local');
  }

  // Se coloca al final de su categoria.
  const [[{ siguiente }]] = await pool.execute(
    `SELECT COALESCE(MAX(ci.orden), 0) + 10 AS siguiente
       FROM carta_items ci
       JOIN platos p ON p.id = ci.plato_id
      WHERE ci.restaurante_id = ?
        AND p.categoria_id = (SELECT categoria_id FROM platos WHERE id = ?)`,
    [restauranteId, plato_id]
  );

  const [res] = await pool.execute(
    `INSERT INTO carta_items (restaurante_id, plato_id, precio, activo, orden, destacado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [restauranteId, plato_id, precio, activo ? 1 : 0, siguiente, destacado ? 1 : 0]
  );

  return obtenerItem(res.insertId);
}

/**
 * Actualiza una linea de carta.
 *
 * Si cambia el precio, el registro en historico_precios va en la MISMA
 * transaccion que el UPDATE. Por eso no se usa un trigger: un trigger no
 * conoce al usuario autenticado sin variables de sesion, y esas son fragiles
 * con pool de conexiones.
 */
export async function actualizar(id, cambios, usuarioId) {
  await transaccion(async (conn) => {
    // FOR UPDATE: bloquea la fila para que dos encargados cambiando el precio
    // a la vez no se pisen ni dejen el historico incoherente.
    const [filas] = await conn.execute(
      'SELECT id, precio, activo, destacado, orden, plato_id FROM carta_items WHERE id = ? FOR UPDATE',
      [id]
    );
    const actual = filas[0];
    if (!actual) throw ApiError.noEncontrado('Esa linea de carta no existe');

    if (cambios.activo === true) {
      const [plato] = await conn.execute('SELECT activo FROM platos WHERE id = ?', [
        actual.plato_id,
      ]);
      if (!plato[0]?.activo) {
        throw ApiError.peticionInvalida(
          'No se puede activar: el plato esta desactivado en el catalogo maestro'
        );
      }
    }

    const columnas = ['precio', 'activo', 'destacado', 'orden'].filter(
      (c) => cambios[c] !== undefined
    );
    if (columnas.length === 0) return;

    const asignaciones = columnas.map((c) => `${c} = ?`).join(', ');
    const valores = columnas.map((c) =>
      typeof cambios[c] === 'boolean' ? (cambios[c] ? 1 : 0) : cambios[c]
    );
    await conn.execute(`UPDATE carta_items SET ${asignaciones} WHERE id = ?`, [...valores, id]);

    const precioNuevo = cambios.precio;
    if (precioNuevo !== undefined && Number(precioNuevo) !== Number(actual.precio)) {
      await conn.execute(
        `INSERT INTO historico_precios (carta_item_id, precio_anterior, precio_nuevo, usuario_id)
         VALUES (?, ?, ?, ?)`,
        [id, actual.precio, precioNuevo, usuarioId]
      );
    }
  });

  return obtenerItem(id);
}

/** Quitar de la carta es desactivar, no borrar: el historico lo necesita. */
export async function desactivar(id) {
  const [res] = await pool.execute('UPDATE carta_items SET activo = 0 WHERE id = ?', [id]);
  if (res.affectedRows === 0) throw ApiError.noEncontrado('Esa linea de carta no existe');
  return obtenerItem(id);
}

/**
 * Reordena una lista de lineas de carta. Los ids que no pertenezcan al local
 * se rechazan enteros: mejor fallar que reordenar a medias.
 */
export async function reordenar(restauranteId, ids) {
  return transaccion(async (conn) => {
    const huecos = ids.map(() => '?').join(', ');
    const [filas] = await conn.execute(
      `SELECT id FROM carta_items WHERE id IN (${huecos}) AND restaurante_id = ?`,
      [...ids, restauranteId]
    );

    if (filas.length !== ids.length) {
      throw ApiError.peticionInvalida(
        'Alguna de las lineas no pertenece a este local o no existe'
      );
    }

    for (const [posicion, id] of ids.entries()) {
      await conn.execute('UPDATE carta_items SET orden = ? WHERE id = ?', [
        (posicion + 1) * 10,
        id,
      ]);
    }

    return { reordenados: ids.length };
  });
}

export async function historico(cartaItemId) {
  const [filas] = await pool.execute(
    `SELECT h.id, h.precio_anterior, h.precio_nuevo, h.fecha,
            u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM historico_precios h
       LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.carta_item_id = ?
      ORDER BY h.fecha DESC, h.id DESC
      LIMIT 200`,
    [cartaItemId]
  );
  return filas;
}

/** Platos del catalogo que este local todavia no sirve. */
export async function disponibles(restauranteId) {
  const [filas] = await pool.execute(
    `SELECT p.id, p.nombre, p.imagen_thumb,
            c.nombre AS categoria_nombre, c.slug AS categoria_slug
       FROM platos p
       JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = 1
        AND NOT EXISTS (
          SELECT 1 FROM carta_items ci
           WHERE ci.plato_id = p.id AND ci.restaurante_id = ?
        )
      ORDER BY c.orden, p.nombre`,
    [restauranteId]
  );
  return filas;
}

async function obtenerItem(id) {
  const [filas] = await pool.execute(
    `SELECT ci.id, ci.restaurante_id, ci.plato_id, ci.precio, ci.activo,
            ci.orden, ci.destacado, p.nombre, p.imagen_thumb,
            p.activo AS plato_activo
       FROM carta_items ci
       JOIN platos p ON p.id = ci.plato_id
      WHERE ci.id = ?`,
    [id]
  );
  const f = filas[0];
  return {
    ...f,
    activo: Boolean(f.activo),
    destacado: Boolean(f.destacado),
    plato_activo: Boolean(f.plato_activo),
  };
}
