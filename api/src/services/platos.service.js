import { pool, transaccion } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const SELECT_PLATO = `
  SELECT p.id, p.categoria_id, p.nombre, p.nombre_en, p.descripcion,
         p.descripcion_en, p.imagen, p.imagen_thumb, p.ancho_cm,
         p.modelo_glb, p.modelo_usdz, p.es_vegetariano,
         p.es_vegano, p.es_canario, p.activo, p.created_at, p.updated_at,
         p.alergenos_revisados_en, u.nombre AS alergenos_revisados_por,
         c.slug AS categoria_slug, c.nombre AS categoria_nombre
    FROM platos p
    JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN usuarios u ON u.id = p.alergenos_revisados_por
`;

const normalizar = (p) => ({
  ...p,
  es_vegetariano: Boolean(p.es_vegetariano),
  es_vegano: Boolean(p.es_vegano),
  es_canario: Boolean(p.es_canario),
  activo: Boolean(p.activo),
  ancho_cm: p.ancho_cm === null ? null : Number(p.ancho_cm),
});

/**
 * El catalogo, filtrado.
 *
 * `falta` responde a los avisos de la portada del panel y tiene que contar
 * EXACTAMENTE lo mismo que admin.resumen.controller.js: si el aviso dice 36 y
 * la lista ensena 41, el que la abre deja de fiarse de los dos numeros. Por eso
 * cada caso de aqui abajo repite la condicion de alli, incluido el detalle de
 * que solo cuenta lo que un cliente puede ver -carta_items activos-.
 *
 * `alcance` trae el local del encargado, que es el mismo recorte que aplica el
 * resumen: cuenta lo suyo, luego lista lo suyo. Va aparte de los filtros de la
 * peticion a proposito, porque no lo elige quien pregunta. El resto del
 * catalogo sigue viendose sin filtro: un encargado necesita el maestro entero
 * para anadir platos a su carta.
 */
export async function listar({ categoria, q, activo, pagina, porPagina, falta }, alcance = {}) {
  const where = [];
  const params = [];

  // "Lo sirve alguien hoy", acotado al local del encargado si lo hay.
  const enCarta = alcance.restauranteId
    ? 'EXISTS (SELECT 1 FROM carta_items ci WHERE ci.plato_id = p.id AND ci.activo = 1 AND ci.restaurante_id = ?)'
    : 'EXISTS (SELECT 1 FROM carta_items ci WHERE ci.plato_id = p.id AND ci.activo = 1)';
  const argCarta = alcance.restauranteId ? [alcance.restauranteId] : [];

  if (falta === 'alergenos') {
    // Pendiente = ni tiene alergenos NI nadie ha confirmado que no lleva.
    where.push(`${enCarta}
      AND NOT EXISTS (SELECT 1 FROM plato_alergenos a WHERE a.plato_id = p.id)
      AND p.alergenos_revisados_en IS NULL`);
    params.push(...argCarta);
  }
  if (falta === 'foto') {
    where.push(`${enCarta} AND (p.imagen IS NULL OR p.imagen = '')`);
    params.push(...argCarta);
  }
  if (falta === 'idiomas') {
    where.push(`${enCarta} AND (p.nombre_en IS NULL OR p.nombre_en = ''
                              OR p.nombre_de IS NULL OR p.nombre_de = '')`);
    params.push(...argCarta);
  }
  if (falta === 'carta') {
    // Del catalogo maestro y sin filtrar por local: un plato que no sirve
    // nadie no es de nadie. El resumen solo se lo ensena al administrador.
    where.push('NOT EXISTS (SELECT 1 FROM carta_items ci WHERE ci.plato_id = p.id)');
  }

  if (categoria) {
    where.push('c.slug = ?');
    params.push(categoria);
  }
  if (q) {
    where.push('(p.nombre LIKE ? OR p.descripcion LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (activo !== 'todos') {
    where.push('p.activo = ?');
    params.push(activo === '1' ? 1 : 0);
  }

  const filtro = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM platos p JOIN categorias c ON c.id = p.categoria_id ${filtro}`,
    params
  );

  // LIMIT y OFFSET no admiten placeholders en sentencias preparadas de MySQL.
  // Los valores vienen de zod como enteros acotados, no de texto del cliente.
  const limite = Number(porPagina);
  const salto = (Number(pagina) - 1) * limite;

  const [filas] = await pool.execute(
    `${SELECT_PLATO} ${filtro} ORDER BY c.orden, p.nombre LIMIT ${limite} OFFSET ${salto}`,
    params
  );

  const alergenos = await alergenosDe(filas.map((f) => f.id));
  const cartas = await cartasDe(filas.map((f) => f.id));

  // Mismo envoltorio { datos } que el resto de la API, con la paginacion
  // aparte: si el listado devolviera sus campos en la raiz, seria el unico
  // endpoint con una forma distinta.
  return {
    datos: filas.map((f) => ({
      ...normalizar(f),
      alergenos: alergenos.get(f.id) ?? [],
      ...(cartas.get(f.id) ?? { locales: 0, unico_restaurante_id: null }),
    })),
    paginacion: {
      total,
      pagina: Number(pagina),
      porPagina: limite,
      paginas: Math.max(1, Math.ceil(total / limite)),
    },
  };
}

export async function obtener(id) {
  const [filas] = await pool.execute(`${SELECT_PLATO} WHERE p.id = ? LIMIT 1`, [id]);
  const plato = filas[0];
  if (!plato) throw ApiError.noEncontrado('Ese plato no existe');

  const alergenos = await alergenosDe([plato.id]);
  const [enCartas] = await pool.execute(
    `SELECT ci.id, ci.restaurante_id, ci.precio, ci.activo, ci.destacado,
            r.nombre AS restaurante_nombre, r.slug AS restaurante_slug
       FROM carta_items ci
       JOIN restaurantes r ON r.id = ci.restaurante_id
      WHERE ci.plato_id = ?
      ORDER BY r.orden`,
    [id]
  );

  return {
    ...normalizar(plato),
    alergenos: alergenos.get(plato.id) ?? [],
    // Cuantos locales lo sirven decide quien puede editarlo: un plato que solo
    // esta en una carta es de ese local; en cuanto lo pone otro, es del grupo.
    locales: enCartas.length,
    unico_restaurante_id: enCartas.length === 1 ? enCartas[0].restaurante_id : null,
    en_cartas: enCartas.map((c) => ({
      ...c,
      activo: Boolean(c.activo),
      destacado: Boolean(c.destacado),
    })),
  };
}

export async function crear(datos) {
  const { alergenos = [], ...plato } = datos;

  return transaccion(async (conn) => {
    const [res] = await conn.execute(
      `INSERT INTO platos
         (categoria_id, nombre, nombre_en, descripcion, descripcion_en,
          es_vegetariano, es_vegano, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plato.categoria_id,
        plato.nombre,
        plato.nombre_en ?? null,
        plato.descripcion ?? null,
        plato.descripcion_en ?? null,
        plato.es_vegetariano ? 1 : 0,
        plato.es_vegano ? 1 : 0,
        plato.activo ? 1 : 0,
      ]
    );

    await sustituirAlergenos(conn, res.insertId, alergenos);
    return res.insertId;
  }).then(obtener);
}

export async function actualizar(id, datos) {
  const { alergenos, ...campos } = datos;

  const columnas = [
    'categoria_id', 'nombre', 'nombre_en', 'descripcion', 'descripcion_en',
    'es_vegetariano', 'es_vegano', 'es_canario', 'activo', 'ancho_cm',
  ].filter((c) => campos[c] !== undefined);

  await transaccion(async (conn) => {
    const [existe] = await conn.execute('SELECT id FROM platos WHERE id = ?', [id]);
    if (existe.length === 0) throw ApiError.noEncontrado('Ese plato no existe');

    if (columnas.length > 0) {
      const asignaciones = columnas.map((c) => `${c} = ?`).join(', ');
      const valores = columnas.map((c) =>
        typeof campos[c] === 'boolean' ? (campos[c] ? 1 : 0) : campos[c] ?? null
      );
      await conn.execute(`UPDATE platos SET ${asignaciones} WHERE id = ?`, [...valores, id]);
    }

    if (alergenos !== undefined) {
      await sustituirAlergenos(conn, id, alergenos);
    }
  });

  return obtener(id);
}

/**
 * Borrado logico. Un plato retirado sigue haciendo falta para el historico de
 * precios, asi que nunca se hace DELETE: se desactiva el plato y, con el,
 * todas las lineas de carta que lo sirven.
 */
export async function desactivar(id) {
  return transaccion(async (conn) => {
    const [res] = await conn.execute('UPDATE platos SET activo = 0 WHERE id = ?', [id]);
    if (res.affectedRows === 0) throw ApiError.noEncontrado('Ese plato no existe');

    const [cartas] = await conn.execute(
      'UPDATE carta_items SET activo = 0 WHERE plato_id = ? AND activo = 1',
      [id]
    );

    return { cartas_desactivadas: cartas.affectedRows };
  });
}

export async function guardarImagen(id, { imagen, thumb }) {
  const [res] = await pool.execute(
    'UPDATE platos SET imagen = ?, imagen_thumb = ? WHERE id = ?',
    [imagen, thumb, id]
  );
  if (res.affectedRows === 0) throw ApiError.noEncontrado('Ese plato no existe');
  return obtener(id);
}

async function sustituirAlergenos(conn, platoId, alergenos) {
  await conn.execute('DELETE FROM plato_alergenos WHERE plato_id = ?', [platoId]);

  // Cambiar la lista invalida la confirmacion anterior. Cocina firmo unos
  // alergenos concretos, no el plato: si la lista cambia, esa firma ya no
  // dice nada sobre lo que hay ahora.
  await conn.execute(
    'UPDATE platos SET alergenos_revisados_en = NULL, alergenos_revisados_por = NULL WHERE id = ?',
    [platoId]
  );

  if (alergenos.length === 0) return;

  const unicos = [...new Set(alergenos)];
  const huecos = unicos.map(() => '(?, ?)').join(', ');
  await conn.execute(
    `INSERT INTO plato_alergenos (plato_id, alergeno_id) VALUES ${huecos}`,
    unicos.flatMap((a) => [platoId, a])
  );
}

/**
 * Deja constancia de que una persona ha comprobado los alergenos del plato.
 *
 * Es un acto aparte de editarlos: guardar el formulario no confirma nada,
 * porque se guarda por mil motivos (cambiar el nombre, la foto). Confirmar
 * tiene que ser algo que alguien hace a proposito y que se pueda auditar.
 */
export async function confirmarAlergenos(id, usuarioId) {
  const [res] = await pool.execute(
    `UPDATE platos SET alergenos_revisados_en = NOW(), alergenos_revisados_por = ?
       WHERE id = ?`,
    [usuarioId, id]
  );
  if (res.affectedRows === 0) throw ApiError.noEncontrado('Ese plato no existe');
  return obtener(id);
}

/**
 * En cuantas cartas esta cada plato, y en cual si solo esta en una. Lo usa el
 * panel para saber que puede tocar un encargado sin tener que preguntar plato
 * a plato.
 */
async function cartasDe(platoIds) {
  const mapa = new Map();
  if (platoIds.length === 0) return mapa;

  const huecos = platoIds.map(() => '?').join(', ');
  const [filas] = await pool.execute(
    `SELECT plato_id, COUNT(*) AS locales, MIN(restaurante_id) AS unico
       FROM carta_items
      WHERE plato_id IN (${huecos})
      GROUP BY plato_id`,
    platoIds
  );

  for (const f of filas) {
    mapa.set(f.plato_id, {
      locales: Number(f.locales),
      unico_restaurante_id: Number(f.locales) === 1 ? f.unico : null,
    });
  }
  return mapa;
}

async function alergenosDe(platoIds) {
  const mapa = new Map();
  if (platoIds.length === 0) return mapa;

  const huecos = platoIds.map(() => '?').join(', ');
  const [filas] = await pool.execute(
    `SELECT pa.plato_id, a.id, a.slug, a.nombre
       FROM plato_alergenos pa
       JOIN alergenos a ON a.id = pa.alergeno_id
      WHERE pa.plato_id IN (${huecos})
      ORDER BY a.id`,
    platoIds
  );

  for (const f of filas) {
    if (!mapa.has(f.plato_id)) mapa.set(f.plato_id, []);
    mapa.get(f.plato_id).push({ id: f.id, slug: f.slug, nombre: f.nombre });
  }
  return mapa;
}
