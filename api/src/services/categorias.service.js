import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

/** Convierte 'Cafés y licores' en 'cafes-y-licores'. */
function aSlug(texto) {
  return texto
    .normalize('NFD')
    // Descompuesta la tilde, se quitan los diacriticos combinantes.
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Listado con la cuenta de platos, que es lo que decide si se puede borrar. */
export async function listar() {
  const [filas] = await pool.execute(
    `SELECT c.id, c.slug, c.nombre, c.nombre_en, c.orden, c.activo,
            COUNT(p.id) AS platos
       FROM categorias c
       LEFT JOIN platos p ON p.categoria_id = c.id
      GROUP BY c.id
      ORDER BY c.orden, c.nombre`
  );
  return filas.map((c) => ({ ...c, activo: Boolean(c.activo), platos: Number(c.platos) }));
}

export async function crear({ nombre, nombre_en, orden }) {
  const slug = aSlug(nombre);
  if (!slug) throw ApiError.peticionInvalida('Ese nombre no da un identificador valido');

  const [existe] = await pool.execute('SELECT id FROM categorias WHERE slug = ?', [slug]);
  if (existe.length > 0) throw ApiError.conflicto('Ya hay una categoria con ese nombre');

  // Al final de la lista si no se dice otra cosa.
  let posicion = orden;
  if (posicion == null) {
    const [[fila]] = await pool.execute(
      'SELECT COALESCE(MAX(orden), 0) + 10 AS n FROM categorias'
    );
    posicion = fila.n;
  }

  const [res] = await pool.execute(
    'INSERT INTO categorias (slug, nombre, nombre_en, orden) VALUES (?, ?, ?, ?)',
    [slug, nombre, nombre_en ?? null, posicion]
  );

  return obtener(res.insertId);
}

export async function actualizar(id, datos) {
  const actual = await obtener(id);

  const columnas = [];
  const valores = [];
  const asignar = (col, val) => {
    columnas.push(`${col} = ?`);
    valores.push(val);
  };

  if (datos.nombre !== undefined && datos.nombre !== actual.nombre) {
    const slug = aSlug(datos.nombre);
    const [choca] = await pool.execute(
      'SELECT id FROM categorias WHERE slug = ? AND id <> ?',
      [slug, id]
    );
    if (choca.length > 0) throw ApiError.conflicto('Ya hay una categoria con ese nombre');
    asignar('nombre', datos.nombre);
    asignar('slug', slug);
  }
  if (datos.nombre_en !== undefined) asignar('nombre_en', datos.nombre_en ?? null);
  if (datos.orden !== undefined) asignar('orden', datos.orden);
  if (datos.activo !== undefined) asignar('activo', datos.activo ? 1 : 0);

  if (columnas.length > 0) {
    await pool.execute(`UPDATE categorias SET ${columnas.join(', ')} WHERE id = ?`, [
      ...valores,
      id,
    ]);
  }

  return obtener(id);
}

/**
 * Solo se borra de verdad una categoria vacia. Si tiene platos se desactiva:
 * borrarla dejaria sin categoria a platos que siguen en cartas y en el
 * historico de precios.
 */
export async function eliminar(id) {
  const categoria = await obtener(id);

  const [[{ platos }]] = await pool.execute(
    'SELECT COUNT(*) AS platos FROM platos WHERE categoria_id = ?',
    [id]
  );

  if (platos > 0) {
    await pool.execute('UPDATE categorias SET activo = 0 WHERE id = ?', [id]);
    return {
      ...(await obtener(id)),
      accion: 'desactivada',
      motivo: `Tiene ${platos} plato${platos > 1 ? 's' : ''} asignado${platos > 1 ? 's' : ''}, asi que se ha ocultado en lugar de borrarla.`,
    };
  }

  await pool.execute('DELETE FROM categorias WHERE id = ?', [id]);
  return { ...categoria, accion: 'eliminada' };
}

export async function reordenar(ids) {
  const huecos = ids.map(() => '?').join(', ');
  const [filas] = await pool.execute(
    `SELECT id FROM categorias WHERE id IN (${huecos})`,
    ids
  );
  if (filas.length !== ids.length) {
    throw ApiError.peticionInvalida('Alguna categoria de la lista no existe');
  }

  for (const [posicion, id] of ids.entries()) {
    await pool.execute('UPDATE categorias SET orden = ? WHERE id = ?', [(posicion + 1) * 10, id]);
  }

  return listar();
}

async function obtener(id) {
  const [filas] = await pool.execute(
    'SELECT id, slug, nombre, nombre_en, orden, activo FROM categorias WHERE id = ? LIMIT 1',
    [id]
  );
  if (!filas[0]) throw ApiError.noEncontrado('Esa categoria no existe');
  return { ...filas[0], activo: Boolean(filas[0].activo) };
}
