import { pool } from '../config/db.js';

/**
 * Los menus de celebracion del grupo, con sus secciones y sus lineas.
 *
 * Tres consultas y el armado en JavaScript, igual que la carta: una sola
 * consulta con dos JOIN devolveria el menu repetido tantas veces como lineas
 * tiene y habria que deshacerlo despues de todos modos.
 *
 * De momento solo los del grupo -restaurante_id NULL-. La columna admite el
 * id de una casa para cuando alguna tenga menus propios; ese dia esto recibe
 * un parametro y no hay que cambiar nada mas.
 */
export async function menusDeCelebracion() {
  const [menus] = await pool.execute(
    `SELECT id, slug, nombre, descripcion, precio_por_persona, unidad_precio,
            minimo_comensales, incluye
       FROM menus_grupo
      WHERE activo = 1 AND restaurante_id IS NULL
      ORDER BY orden, id`
  );

  if (menus.length === 0) return [];

  const huecosMenus = menus.map(() => '?').join(', ');
  const [secciones] = await pool.execute(
    `SELECT id, menu_id, titulo, nota
       FROM menu_grupo_secciones
      WHERE menu_id IN (${huecosMenus})
      ORDER BY menu_id, orden, id`,
    menus.map((m) => m.id)
  );

  const lineasPorSeccion = await cargarLineas(secciones.map((s) => s.id));

  const seccionesPorMenu = new Map();
  for (const s of secciones) {
    if (!seccionesPorMenu.has(s.menu_id)) seccionesPorMenu.set(s.menu_id, []);
    seccionesPorMenu.get(s.menu_id).push({
      id: s.id,
      titulo: s.titulo,
      nota: s.nota,
      lineas: lineasPorSeccion.get(s.id) ?? [],
    });
  }

  return menus
    .map((m) => ({
      id: m.id,
      slug: m.slug,
      nombre: m.nombre,
      descripcion: m.descripcion,
      precio: Number(m.precio_por_persona),
      unidad_precio: m.unidad_precio,
      minimo_comensales: m.minimo_comensales,
      incluye: m.incluye,
      secciones: seccionesPorMenu.get(m.id) ?? [],
    }))
    // Un menu sin secciones es una tarjeta con nombre y precio y nada mas:
    // el precio sin saber que entra no informa, desconcierta. Mientras se
    // esta cargando a mano en la base, mejor que no aparezca todavia.
    .filter((m) => m.secciones.some((s) => s.lineas.length > 0));
}

async function cargarLineas(seccionIds) {
  const mapa = new Map();
  if (seccionIds.length === 0) return mapa;

  const huecos = seccionIds.map(() => '?').join(', ');
  const [filas] = await pool.execute(
    `SELECT id, seccion_id, texto
       FROM menu_grupo_lineas
      WHERE seccion_id IN (${huecos})
      ORDER BY seccion_id, orden, id`,
    seccionIds
  );

  for (const f of filas) {
    if (!mapa.has(f.seccion_id)) mapa.set(f.seccion_id, []);
    mapa.get(f.seccion_id).push({ id: f.id, texto: f.texto });
  }

  return mapa;
}
