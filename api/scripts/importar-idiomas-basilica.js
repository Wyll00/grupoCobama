/**
 * Trae el ingles y el aleman de la carta de papel de La Basilica.
 *
 *   npm run idiomas --prefix api
 *
 * La fuente es "La Basilica/assets/carta.js", la misma de la que se importo la
 * carta. Trae nombre en los tres idiomas para 72 platos y descripcion para 30,
 * mas las 8 secciones. Se perdia al importar porque no habia columnas donde
 * meterlo.
 *
 * SOLO TOCA TRADUCCIONES. No crea platos, no borra, no cambia precios ni el
 * nombre en castellano: si un plato del fuente no existe en la base, se dice
 * y se pasa al siguiente. Un script de traducciones que ademas da de alta
 * platos es un script del que nadie se fia para volver a pasarlo.
 *
 * Empareja por NOMBRE EXACTO en castellano, no por parecido. En la
 * importacion de la carta el parecido creo duplicados -"senyoret" contra
 * "senorito"- y uno acabo publicado sin alergenos. Aqui un fallo es menos
 * grave, pero traducir mal un plato es peor que no traducirlo: quien lee
 * "Wrackbarsch" y le traen otra cosa no vuelve.
 *
 * Se puede pasar las veces que haga falta: escribe el valor, no lo alterna.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { pool } from '../src/config/db.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FUENTE = join(AQUI, '..', '..', 'La Basilica', 'assets', 'carta.js');

/** Seccion del fuente -> slug de la categoria en la base. */
const CATEGORIAS = {
  entrantes: 'entrantes',
  ensaladas: 'ensaladas',
  pescados: 'pescados',
  carnes: 'carnes',
  salsas: 'salsas',
  arroces: 'arroces',
  postres: 'postres',
};

async function main() {
  const carta = await import(`file://${FUENTE.replace(/\\/g, '/')}`);

  // ---------------------------------------------------------------- platos
  const traducciones = new Map();
  for (const seccion of carta.secciones ?? []) {
    for (const plato of seccion.platos ?? []) {
      if (!plato.nombre) continue;
      // El primero gana: un plato puede salir en su seccion y otra vez en
      // "fuera de carta", y ahi a veces va sin traducir.
      if (traducciones.has(plato.nombre)) continue;
      traducciones.set(plato.nombre, {
        nombreEn: plato.nombreEn ?? null,
        nombreDe: plato.nombreDe ?? null,
        descEn: plato.descEn ?? null,
        descDe: plato.descDe ?? null,
      });
    }
  }

  const [filas] = await pool.query('SELECT id, nombre FROM platos');
  const porNombre = new Map(filas.map((f) => [f.nombre, f.id]));

  let tocados = 0;
  const sinCuadrar = [];
  for (const [nombre, t] of traducciones) {
    const id = porNombre.get(nombre);
    if (!id) {
      sinCuadrar.push(nombre);
      continue;
    }
    // COALESCE al reves de lo que parece: gana lo del fuente, y si el fuente
    // no trae nada se queda lo que ya hubiera. Asi pasarlo dos veces no borra
    // una traduccion escrita a mano en el panel.
    await pool.execute(
      `UPDATE platos
          SET nombre_en = COALESCE(?, nombre_en),
              nombre_de = COALESCE(?, nombre_de),
              descripcion_en = COALESCE(?, descripcion_en),
              descripcion_de = COALESCE(?, descripcion_de)
        WHERE id = ?`,
      [t.nombreEn, t.nombreDe, t.descEn, t.descDe, id]
    );
    tocados += 1;
  }

  // ------------------------------------------------------------ categorias
  let categorias = 0;
  for (const seccion of carta.secciones ?? []) {
    const slug = CATEGORIAS[seccion.id];
    if (!slug) continue;
    const [res] = await pool.execute(
      `UPDATE categorias
          SET nombre_en = COALESCE(?, nombre_en), nombre_de = COALESCE(?, nombre_de)
        WHERE slug = ?`,
      [seccion.nombreEn ?? null, seccion.nombreDe ?? null, slug]
    );
    if (res.affectedRows) categorias += 1;
  }

  // ---------------------------------------------------------------- cuentas
  const [[cuenta]] = await pool.query(
    `SELECT SUM(nombre_en IS NOT NULL) AS en, SUM(nombre_de IS NOT NULL) AS de,
            COUNT(*) AS total
       FROM platos WHERE activo = 1`
  );

  console.log(`platos actualizados: ${tocados} de ${traducciones.size} del fuente`);
  console.log(`categorias actualizadas: ${categorias}`);
  for (const n of sinCuadrar) console.log(`  SIN CUADRAR  "${n}"`);
  console.log(
    `\nEn la base, de ${cuenta.total} platos activos: ${cuenta.en} con nombre en ingles, ` +
      `${cuenta.de} en aleman.`
  );
  if (sinCuadrar.length) {
    console.log(
      'Los que no cuadran hay que mirarlos a mano: suele ser una tilde o unas comillas distintas.'
    );
  }
}

await main();
await pool.end();
