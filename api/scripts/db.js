/**
 * Gestion del esquema y los datos de la base de datos.
 *
 *   npm run db:migrate  --prefix api    aplica db/migrations
 *   npm run db:seed     --prefix api    aplica db/seeds
 *   npm run db:setup    --prefix api    las dos cosas
 *   npm run db:estado   --prefix api    que hay aplicado
 *   npm run db:adoptar  --prefix api -- 001_schema.sql
 *                                       marca como aplicado, sin ejecutarlo,
 *                                       todo lo anterior o igual a ese fichero
 *                                       (para una BD cargada con el metodo viejo)
 */
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aplicar, marcarComoAplicadas, estado } from '../src/lib/migraciones.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIGRACIONES = join(RAIZ, 'db', 'migrations');
const SEEDS = join(RAIZ, 'db', 'seeds');

const orden = process.argv[2];
const argumento = process.argv[3];

const acciones = {
  async migrate() {
    await aplicar(MIGRACIONES, 'migracion');
  },
  async seed() {
    await aplicar(SEEDS, 'seed');
  },
  async setup() {
    await aplicar(MIGRACIONES, 'migracion');
    await aplicar(SEEDS, 'seed');
  },
  async adoptar() {
    await marcarComoAplicadas(MIGRACIONES, 'migracion', argumento);
    // Los seeds se adoptan enteros: cargarlos dos veces solo duplicaria datos,
    // no deja el esquema a medias.
    const ultimoSeed = (await readdir(SEEDS)).filter((f) => f.endsWith('.sql')).sort().at(-1);
    await marcarComoAplicadas(SEEDS, 'seed', ultimoSeed);
  },
  async estado() {
    const filas = await estado();
    if (filas.length === 0) {
      console.log('No hay nada aplicado.');
      return;
    }
    for (const f of filas) {
      console.log(`${f.lote.padEnd(10)} ${f.nombre.padEnd(24)} ${f.aplicada}`);
    }
  },
};

if (!acciones[orden]) {
  console.error(`Orden desconocida: ${orden}`);
  console.error(`Disponibles: ${Object.keys(acciones).join(', ')}`);
  process.exit(1);
}

try {
  await acciones[orden]();
} catch (err) {
  console.error(`\n${err.message}`);
  process.exit(1);
}
