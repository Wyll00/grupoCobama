/**
 * Importa la carta REAL de La Basilica.
 *
 *   npm run carta-real --prefix api           ensayo: dice que haria
 *   npm run carta-real --prefix api -- --sql  aplicarlo
 *
 * La fuente es "La Basilica/assets/carta.js", la carta que ya esta publicada
 * en basilicacarta.pages.dev, transcrita del papel de la mesa. Trae nombres,
 * precios, descripciones y traducciones al ingles.
 *
 * Que NO importa, y por que
 * -------------------------
 *   Fuera de carta   La seccion esta marcada `borrador` y sus cinco platos
 *                    son inventados para ver como quedaba. Se salta.
 *
 *   Bebidas          bebidas.js entero esta en borrador: "las referencias y
 *                    los precios de esta pagina estan sin confirmar por el
 *                    local". Las bebidas que ya hay en la base son igual de
 *                    provisionales, asi que cambiar unas por otras no mejora
 *                    nada y encima borraria el trabajo hecho en el panel.
 *
 *   Alergenos        La carta web no los lleva, a proposito y bien
 *                    explicado: los iconos del papel no se leian con
 *                    garantia en las fotos. Ya estan cargados aparte, desde
 *                    la transcripcion, y cuelgan del plato, asi que este
 *                    script no los toca.
 *
 * Es idempotente: empareja por nombre normalizado, asi que volver a
 * ejecutarlo actualiza precios en vez de duplicar platos.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { pool } from '../src/config/db.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const FUENTE = join(RAIZ, 'La Basilica', 'assets', 'carta.js');

const LOCAL_ID = 2; // La Basilica

/** Seccion de la carta de papel -> categoria de la base. */
const CATEGORIAS = {
  entrantes: 'entrantes',
  ensaladas: 'ensaladas',
  'pescados-mariscos': 'pescados',
  pescados: 'pescados',
  carnes: 'carnes',
  salsas: 'salsas',
  arroces: 'arroces',
  'arroces-fideua': 'arroces',
  postres: 'postres',
};

/** Por si el id de la seccion no cuadra: se busca tambien por el nombre. */
const POR_NOMBRE = {
  Entrantes: 'entrantes',
  Ensaladas: 'ensaladas',
  'Pescados y mariscos': 'pescados',
  Carnes: 'carnes',
  Salsas: 'salsas',
  'Arroces y fideuá': 'arroces',
  Postres: 'postres',
};

const normalizar = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[«»"'()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const euros = (n) => (n === null || n === undefined ? '—' : `${n.toFixed(2)} €`);

async function main() {
  const aplicar = process.argv.includes('--sql');

  // El fichero es un modulo ES con exports, asi que se importa en vez de
  // parsearse: lo que se lee es exactamente lo que sirve la web publicada.
  const carta = await import(`file://${FUENTE.replace(/\\/g, '/')}`);

  const secciones = carta.secciones.filter((s) => !s.borrador);
  const saltadas = carta.secciones.filter((s) => s.borrador);

  const [cats] = await pool.execute('SELECT id, slug FROM categorias');
  const catPorSlug = new Map(cats.map((c) => [c.slug, c.id]));

  const [platosBd] = await pool.execute('SELECT id, nombre FROM platos');
  const platoPorNombre = new Map(platosBd.map((p) => [normalizar(p.nombre), p]));

  const entrantes = [];
  let orden = 0;

  for (const seccion of secciones) {
    const slug = CATEGORIAS[seccion.id] ?? POR_NOMBRE[seccion.nombre];
    const categoriaId = catPorSlug.get(slug);
    if (!categoriaId) {
      throw new Error(`Sin categoria para la seccion "${seccion.nombre}" (id ${seccion.id})`);
    }

    for (const plato of seccion.platos) {
      orden += 1;
      entrantes.push({
        seccion: seccion.nombre,
        categoriaId,
        orden,
        numero: plato.n ?? null,
        nombre: plato.nombre,
        nombreEn: plato.nombreEn ?? null,
        desc: plato.desc ?? null,
        descEn: plato.descEn ?? null,
        vegano: (plato.etiquetas ?? []).includes('vegano'),
        precio: plato.racion ?? null,
        media: plato.media ?? null,
        unidad: plato.unidad ?? 'racion',
        existente: platoPorNombre.get(normalizar(plato.nombre)) ?? null,
      });
    }
  }

  // Lo que hay ahora en la carta de comida del local. Las bebidas se
  // localizan por categoria y se dejan en paz.
  const [actuales] = await pool.execute(
    `SELECT ci.id, ci.plato_id, p.nombre, ci.precio,
            (SELECT COUNT(*) FROM historico_precios h WHERE h.carta_item_id = ci.id) AS historico
       FROM carta_items ci
       JOIN platos p ON p.id = ci.plato_id
       JOIN categorias c ON c.id = p.categoria_id
      WHERE ci.restaurante_id = ?
        AND c.slug NOT IN ('bebidas', 'refrescos', 'cervezas', 'vinos', 'cafes-licores')`,
    [LOCAL_ID]
  );

  const nombresNuevos = new Set(entrantes.map((e) => normalizar(e.nombre)));
  const aRetirar = actuales.filter((a) => !nombresNuevos.has(normalizar(a.nombre)));

  // ------------------------------------------------------------- informe
  console.log(`Fuente: ${FUENTE}`);
  console.log(`Secciones: ${secciones.length} (${saltadas.length} en borrador, se saltan)`);
  for (const s of saltadas) console.log(`  se salta "${s.nombre}" (${s.platos.length} platos inventados)`);
  console.log();

  const nuevos = entrantes.filter((e) => !e.existente);
  console.log(`Platos en la carta real: ${entrantes.length}`);
  console.log(`  ya estan en el catalogo: ${entrantes.length - nuevos.length}`);
  console.log(`  se crean:                ${nuevos.length}`);
  console.log();

  console.log(`Lineas de comida que tiene ahora el local: ${actuales.length}`);
  console.log(`  se quedan y se les pone el precio real: ${actuales.length - aRetirar.length}`);
  console.log(`  se retiran (son de relleno):            ${aRetirar.length}`);
  for (const a of aRetirar) {
    console.log(`    - ${a.nombre} (${euros(Number(a.precio))})${a.historico > 0 ? `  OJO: tiene ${a.historico} cambios de precio en el historico` : ''}`);
  }
  console.log();

  const conMedia = entrantes.filter((e) => e.media);
  const conUnidad = entrantes.filter((e) => e.unidad !== 'racion');
  console.log(`Con media racion: ${conMedia.length}`);
  for (const e of conMedia) console.log(`    ${e.nombre.padEnd(42)} media ${euros(e.media)} / racion ${euros(e.precio)}`);
  console.log();
  console.log(`Con precio por unidad: ${conUnidad.length}`);
  for (const e of conUnidad) console.log(`    ${e.nombre.padEnd(42)} ${euros(e.precio)} por ${e.unidad}`);
  console.log();

  const sinPrecio = entrantes.filter((e) => e.precio === null);
  if (sinPrecio.length > 0) {
    console.log(`SIN PRECIO (${sinPrecio.length}), no se pueden poner en carta:`);
    for (const e of sinPrecio) console.log(`    - ${e.nombre}`);
    console.log();
  }

  if (!aplicar) {
    console.log('Esto ha sido un ensayo. Para aplicarlo:');
    console.log('  npm run carta-real --prefix api -- --sql');
    return;
  }

  // -------------------------------------------------------------- aplicar
  const cx = await pool.getConnection();
  try {
    await cx.beginTransaction();

    for (const e of entrantes) {
      let platoId = e.existente?.id;

      if (platoId) {
        // La categoria solo se mueve si el plato lo sirve nada mas que esta
        // casa. La seccion es del plato y no de la linea de carta, asi que
        // cambiarla en un plato compartido se la cambia tambien a los demas
        // locales, y esa no es una decision que pueda tomar un importador de
        // una sola carta. Los compartidos que no cuadran se listan al final.
        const [dondeSeSirve] = await cx.execute(
          'SELECT COUNT(*) AS locales FROM carta_items WHERE plato_id = ?',
          [platoId]
        );
        const soloAqui = dondeSeSirve[0].locales <= 1;

        await cx.execute(
          `UPDATE platos
              SET nombre = ?, nombre_en = COALESCE(?, nombre_en),
                  descripcion = COALESCE(?, descripcion),
                  descripcion_en = COALESCE(?, descripcion_en),
                  es_vegano = ?, activo = 1
                  ${soloAqui ? ', categoria_id = ?' : ''}
            WHERE id = ?`,
          soloAqui
            ? [e.nombre, e.nombreEn, e.desc, e.descEn, e.vegano ? 1 : 0, e.categoriaId, platoId]
            : [e.nombre, e.nombreEn, e.desc, e.descEn, e.vegano ? 1 : 0, platoId]
        );

        if (!soloAqui) e.compartido = true;
      } else {
        const [res] = await cx.execute(
          `INSERT INTO platos
             (categoria_id, nombre, nombre_en, descripcion, descripcion_en, es_vegano, activo)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [e.categoriaId, e.nombre, e.nombreEn, e.desc, e.descEn, e.vegano ? 1 : 0]
        );
        platoId = res.insertId;
      }

      if (e.precio === null) continue;

      const [existeLinea] = await cx.execute(
        'SELECT id FROM carta_items WHERE restaurante_id = ? AND plato_id = ? LIMIT 1',
        [LOCAL_ID, platoId]
      );

      if (existeLinea[0]) {
        await cx.execute(
          `UPDATE carta_items
              SET precio = ?, precio_media = ?, unidad = ?, numero_carta = ?,
                  orden = ?, activo = 1
            WHERE id = ?`,
          [e.precio, e.media, e.unidad, e.numero, e.orden, existeLinea[0].id]
        );
      } else {
        await cx.execute(
          `INSERT INTO carta_items
             (restaurante_id, plato_id, precio, precio_media, unidad, numero_carta, orden, activo)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [LOCAL_ID, platoId, e.precio, e.media, e.unidad, e.numero, e.orden]
        );
      }
    }

    // Las de relleno: se quitan de la carta de ESTE local. El plato se queda
    // en el catalogo por si otra casa lo sirve.
    for (const a of aRetirar) {
      await cx.execute('DELETE FROM historico_precios WHERE carta_item_id = ?', [a.id]);
      await cx.execute('DELETE FROM carta_items WHERE id = ?', [a.id]);
    }

    await cx.commit();

    console.log(`Aplicado: ${entrantes.length} platos en carta, ${aRetirar.length} lineas de relleno retiradas.`);
    console.log('Las bebidas y los alergenos no se han tocado.');

    // Los compartidos que estan en otra seccion: se avisa en vez de moverlos
    // por las bravas, porque afecta a la carta de los otros locales.
    const descolocados = [];
    for (const e of entrantes.filter((x) => x.compartido)) {
      const [f] = await pool.execute(
        `SELECT c.slug AS actual,
                (SELECT GROUP_CONCAT(r.nombre SEPARATOR ', ')
                   FROM carta_items ci JOIN restaurantes r ON r.id = ci.restaurante_id
                  WHERE ci.plato_id = p.id) AS quienes
           FROM platos p JOIN categorias c ON c.id = p.categoria_id
          WHERE p.id = (SELECT id FROM platos WHERE nombre = ? LIMIT 1)`,
        [e.nombre]
      );
      const actual = f[0];
      const [cat] = await pool.execute('SELECT slug FROM categorias WHERE id = ?', [e.categoriaId]);
      if (actual && actual.actual !== cat[0].slug) {
        descolocados.push({ nombre: e.nombre, actual: actual.actual, deberia: cat[0].slug, quienes: actual.quienes });
      }
    }

    if (descolocados.length > 0) {
      console.log(`
En otra seccion, y NO se han movido porque los sirven varios locales:`);
      for (const d of descolocados) {
        console.log(`  ${d.nombre}: esta en "${d.actual}", en el papel va en "${d.deberia}"`);
        console.log(`    lo sirven: ${d.quienes}`);
      }
      console.log('  Moverlos les cambia la seccion tambien a esas casas. Decidelo tu.');
    }
  } catch (err) {
    await cx.rollback();
    throw err;
  } finally {
    cx.release();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
