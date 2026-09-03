import { pool } from '../config/db.js';

/**
 * Los menus de celebracion que se sirven en un local, con secciones y lineas.
 *
 * Devuelve los suyos MAS los que tengan restaurante_id NULL, que significa
 * "del grupo, iguales en las cuatro casas". Hoy no hay ninguno asi -los tres
 * que existen son de La Basilica-, pero es lo que quiere decir esa columna, y
 * filtrarlos fuera los esconderia el dia que los haya.
 *
 * Tres consultas y el armado en JavaScript, igual que la carta: una sola con
 * dos JOIN devolveria el menu repetido tantas veces como lineas tiene y
 * habria que deshacerlo despues de todos modos.
 *
 * Un slug que no existe devuelve lista vacia y no un error: esto es un
 * anadido de la ficha, y el 404 del local lo da la consulta principal.
 */
export async function menusDeCelebracion(slug) {
  const [menus] = await pool.execute(
    `SELECT id, slug, nombre, descripcion, precio_por_persona, unidad_precio,
            minimo_comensales, incluye
       FROM menus_grupo
      WHERE activo = 1
        AND (restaurante_id IS NULL
             OR restaurante_id = (SELECT id FROM restaurantes
                                   WHERE slug = ? AND activo = 1))
      ORDER BY orden, id`,
    [slug]
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
