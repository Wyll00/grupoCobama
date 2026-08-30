/**
 * Marca como canarios los platos que ya venian etiquetados en la carta de
 * papel de La Basilica.
 *
 *   npm run canarios --prefix api
 *
 * El dato existia desde el principio -19 entradas con etiquetas: ['canaria']
 * en La Basilica/assets/carta.js- pero se perdia al importar porque no habia
 * columna donde guardarlo.
 *
 * Empareja POR NOMBRE EXACTO y no por parecido. Es a proposito: en la
 * importacion de la carta, emparejar por parecido creo platos duplicados
 * -"senyoret" contra "senorito"- y uno de ellos se publico sin alergenos. Aqui
 * un fallo es menos grave, pero el criterio se mantiene: lo que no cuadre
 * exacto se dice en pantalla y lo mira una persona.
 *
 * Se puede pasar dos veces sin romper nada: pone el valor, no lo alterna.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { pool } from '../src/config/db.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const FUENTE = join(RAIZ, 'La Basilica', 'assets', 'carta.js');

async function main() {
  const carta = await import(`file://${FUENTE.replace(/\\/g, '/')}`);

  // Los nombres del fuente que llevan la etiqueta, sin repetir: un mismo plato
  // sale en su seccion y a veces tambien en "fuera de carta".
  const canarios = new Set();
  for (const seccion of carta.secciones ?? []) {
    for (const plato of seccion.platos ?? []) {
      if (plato.etiquetas?.includes('canaria') && plato.nombre) canarios.add(plato.nombre);
    }
  }

  if (canarios.size === 0) {
    console.log('El fuente no trae ningun plato etiquetado como canario.');
    return;
  }

  const [filas] = await pool.query('SELECT id, nombre FROM platos');
  const porNombre = new Map(filas.map((f) => [f.nombre, f.id]));

  const encontrados = [];
  const sinEncontrar = [];
  for (const nombre of canarios) {
    const id = porNombre.get(nombre);
    if (id) encontrados.push({ id, nombre });
    else sinEncontrar.push(nombre);
  }

  if (encontrados.length > 0) {
    const huecos = encontrados.map(() => '?').join(', ');
    // Placeholders uno a uno: execute() no expande arrays dentro de IN (?),
    // los manda como un solo valor y la condicion no casa con nada.
    await pool.execute(
      `UPDATE platos SET es_canario = 1 WHERE id IN (${huecos})`,
      encontrados.map((e) => e.id)
    );
  }

  for (const e of encontrados) console.log(`  canario  ${e.nombre}`);
  for (const n of sinEncontrar) console.log(`  SIN CUADRAR  "${n}" - no hay ningun plato con ese nombre exacto`);

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM platos WHERE es_canario = 1');
  console.log(`\n${encontrados.length} de ${canarios.size} del fuente. En la base hay ${total} platos canarios.`);
  if (sinEncontrar.length > 0) {
    console.log('Los que no cuadran hay que mirarlos a mano: puede ser una tilde o una comilla distinta.');
  }
}

await main();
await pool.end();
