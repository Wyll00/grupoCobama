/**
 * Carga la transcripcion de alergenos de La Basilica.
 *
 *   npm run carta-basilica --prefix api           ver que haria, sin tocar nada
 *   npm run carta-basilica --prefix api -- --sql  aplicarlo
 *
 * Fuente: db/datos/alergenos-basilica.json, transcrito de las fotos de la
 * carta impresa.
 *
 * Que hace y que NO hace
 * ----------------------
 * Los platos entran en el CATALOGO del grupo (tabla platos) con sus
 * alergenos. No entran en la carta de ningun local, porque la transcripcion
 * es un documento de alergenos y no trae precios. Inventar un precio para
 * que "se vea algo" seria peor que no tener el plato: un precio falso en una
 * carta publica lo lee un cliente como si fuera de verdad.
 *
 * Cuando lleguen los precios, anadirlos a la carta desde el panel arrastra
 * los alergenos solos, porque cuelgan del plato y no del item de carta. Para
 * eso se separo el catalogo de la carta.
 *
 * Todo lo que carga queda con alergenos_revisados_en = NULL: sin confirmar.
 *
 * Es idempotente: empareja por nombre normalizado, asi que volver a
 * ejecutarlo actualiza en vez de duplicar.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { pool } from '../src/config/db.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FICHERO = join(AQUI, '..', '..', 'db', 'datos', 'alergenos-basilica.json');

const NOTA_FIDEUA = 'Con fideua contiene gluten. La version con arroz, no.';

/** Para emparejar "Principe Alberto" con "Principe Alberto" venga como venga. */
function normalizar(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[«»"'()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const aplicar = process.argv.includes('--sql');
  const datos = JSON.parse(await readFile(FICHERO, 'utf8'));

  const [cats] = await pool.execute('SELECT id, slug FROM categorias');
  const catPorSlug = new Map(cats.map((c) => [c.slug, c.id]));

  const [alergenos] = await pool.execute('SELECT id, slug FROM alergenos');
  const alergenoPorSlug = new Map(alergenos.map((a) => [a.slug, a.id]));

  const [existentes] = await pool.execute('SELECT id, nombre, categoria_id FROM platos');
  const porNombre = new Map(existentes.map((p) => [normalizar(p.nombre), p]));

  const nuevos = [];
  const emparejados = [];

  for (const plato of datos.platos) {
    const categoria_id = catPorSlug.get(plato.cat);
    if (!categoria_id) throw new Error(`Categoria desconocida: ${plato.cat}`);

    const ids = plato.alergenos.map((codigo) => {
      const slug = datos._codigos[codigo];
      const id = alergenoPorSlug.get(slug);
      if (!id) throw new Error(`Alergeno desconocido: ${codigo} -> ${slug}`);
      return id;
    });

    const yaEsta = porNombre.get(normalizar(plato.nombre));
    (yaEsta ? emparejados : nuevos).push({ ...plato, categoria_id, ids, existente: yaEsta });
  }

  console.log(`Transcripcion: ${datos.platos.length} platos`);
  console.log(`  ya estan en el catalogo: ${emparejados.length} (se les ponen los alergenos)`);
  console.log(`  se crean:                ${nuevos.length}\n`);

  if (emparejados.length > 0) {
    console.log('Emparejados por nombre:');
    for (const p of emparejados) {
      console.log(`  #${String(p.existente.id).padStart(3)} ${p.nombre}  ->  ${p.alergenos.join(', ') || 'sin alergenos'}`);
    }
    console.log();
  }

  if (!aplicar) {
    console.log('Esto ha sido un ensayo. Para aplicarlo:');
    console.log('  npm run carta-basilica --prefix api -- --sql');
    return;
  }

  const cx = await pool.getConnection();
  try {
    await cx.beginTransaction();

    for (const p of [...emparejados, ...nuevos]) {
      let platoId = p.existente?.id;

      const descripcion = p.nota_fideua ? NOTA_FIDEUA : null;

      if (platoId) {
        // Un plato que ya existe no se renombra ni se recategoriza: puede
        // estar en la carta de otro local con ese nombre. Solo alergenos.
        if (descripcion) {
          await cx.execute(
            'UPDATE platos SET descripcion = COALESCE(NULLIF(descripcion, ""), ?) WHERE id = ?',
            [descripcion, platoId]
          );
        }
      } else {
        const [res] = await cx.execute(
          'INSERT INTO platos (categoria_id, nombre, descripcion, activo) VALUES (?, ?, ?, 1)',
          [p.categoria_id, p.nombre, descripcion]
        );
        platoId = res.insertId;
      }

      // Se reemplaza la lista entera en vez de anadir: si la transcripcion
      // quita un alergeno, tiene que desaparecer tambien aqui.
      await cx.execute('DELETE FROM plato_alergenos WHERE plato_id = ?', [platoId]);
      for (const alergenoId of p.ids) {
        await cx.execute(
          'INSERT INTO plato_alergenos (plato_id, alergeno_id, trazas) VALUES (?, ?, 0)',
          [platoId, alergenoId]
        );
      }

      // Viene de una foto: nadie de cocina lo ha firmado.
      await cx.execute(
        'UPDATE platos SET alergenos_revisados_en = NULL, alergenos_revisados_por = NULL WHERE id = ?',
        [platoId]
      );
    }

    await cx.commit();
    console.log(`Aplicado: ${emparejados.length} actualizados, ${nuevos.length} creados.`);
    console.log('Todos quedan SIN CONFIRMAR hasta que cocina los revise.');
    console.log('\nNo se ha tocado ninguna carta: estos platos estan en el catalogo,');
    console.log('sin precio. Se anaden a la carta de cada local desde el panel.');
  } catch (e) {
    await cx.rollback();
    throw e;
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
