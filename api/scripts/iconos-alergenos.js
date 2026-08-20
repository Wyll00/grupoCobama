/**
 * Procesa los iconos de alergenos.
 *
 * Deja los originales (PNG/JPG/SVG, del tamano que sean) en la carpeta
 * iconos-alergenos/ de la raiz y ejecuta:
 *
 *   npm run alergenos --prefix api
 *
 * El script recorta el margen transparente, los cuadra a 128x128, los guarda
 * en WebP dentro de web/public/alergenos/ y apunta el nombre del fichero en
 * la columna alergenos.icono. Al terminar dice cuales de los 14 obligatorios
 * siguen sin imagen.
 *
 * Los originales no entran en el repositorio (pesan ~9 MB y son material con
 * licencia); lo que se versiona es el WebP resultante, que es lo que necesita
 * el build de la web.
 */
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import 'dotenv/config';
import { pool } from '../src/config/db.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const ORIGEN = join(RAIZ, 'iconos-alergenos');
const DESTINO = join(RAIZ, 'web', 'public', 'alergenos');

const LADO = 128; // se muestran a 22 px en la lista y a 44 px en la leyenda
const CALIDAD = 82;

/**
 * El nombre del fichero no siempre coincide con el slug de la tabla
 * ("pescados.png" -> "pescado"). Todo lo que no este aqui se normaliza solo:
 * minusculas, sin acentos y guiones bajos a guiones.
 */
const ALIAS = new Map([
  ['dioxido-azufre-sulfitos', 'sulfitos'],
  ['dioxido-de-azufre-y-sulfitos', 'sulfitos'],
  ['granos-de-sesamo', 'sesamo'],
  ['frutos-de-cascara', 'frutos-cascara'],
  ['pescados', 'pescado'],
  ['leche', 'lacteos'],
  ['crustaceo', 'crustaceos'],
  ['molusco', 'moluscos'],
  ['huevo', 'huevos'],
  ['altramuz', 'altramuces'],
]);

const EXTENSIONES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

function aSlug(nombreFichero) {
  const base = basename(nombreFichero, extname(nombreFichero))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return ALIAS.get(base) ?? base;
}

async function main() {
  await mkdir(DESTINO, { recursive: true });

  const [alergenos] = await pool.execute('SELECT id, slug, nombre FROM alergenos ORDER BY id');
  const porSlug = new Map(alergenos.map((a) => [a.slug, a]));

  let ficheros = [];
  try {
    ficheros = (await readdir(ORIGEN)).filter((f) => EXTENSIONES.has(extname(f).toLowerCase()));
  } catch {
    console.error(`No existe la carpeta ${ORIGEN}. Creala y deja ahi los iconos.`);
    process.exitCode = 1;
    return;
  }

  if (ficheros.length === 0) {
    console.log(`No hay imagenes en ${ORIGEN}. Nada que hacer.`);
    return;
  }

  const hechos = [];
  const huerfanos = [];

  for (const fichero of ficheros.sort()) {
    const slug = aSlug(fichero);
    const alergeno = porSlug.get(slug);

    // Sin esto un fallo de nombre generaria un WebP que no apunta a nada y
    // nadie se enteraria hasta ver un hueco en la carta.
    if (!alergeno) {
      huerfanos.push({ fichero, slug });
      continue;
    }

    const salida = `${slug}.webp`;
    const buffer = await sharp(join(ORIGEN, fichero))
      .trim() // fuera el margen transparente: si no, cada icono se ve de un tamano
      .resize(LADO, LADO, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: CALIDAD, alphaQuality: 100 })
      .toBuffer();

    await writeFile(join(DESTINO, salida), buffer);
    await pool.execute('UPDATE alergenos SET icono = ? WHERE id = ?', [salida, alergeno.id]);

    hechos.push({ nombre: alergeno.nombre, salida, kb: (buffer.length / 1024).toFixed(1) });
  }

  for (const h of hechos) {
    console.log(`  OK  ${h.nombre.padEnd(30)} -> ${h.salida.padEnd(22)} ${h.kb} KB`);
  }

  if (huerfanos.length > 0) {
    console.log('\nNo se han reconocido (el nombre no cuadra con ningun alergeno):');
    for (const h of huerfanos) console.log(`  ??  ${h.fichero}  (buscaba el slug "${h.slug}")`);
    console.log('Renombra el fichero como el slug, o anade el alias en ALIAS.');
  }

  // El seed inicial dejo nombres de relleno en icono ("wheat", "mustard") que
  // no son ficheros. Si se quedan, la carta pinta una imagen rota justo donde
  // va un alergeno, que es peor que no pintar nada: parece un fallo de carga y
  // el cliente no sabe si falta informacion. Se limpian.
  // Ojo: execute() son sentencias preparadas y NO expanden un array a una
  // lista de IN(...). Hay que poner los huecos a mano.
  const generados = [...new Set(hechos.map((h) => h.salida))];
  const huecosGen = generados.length > 0 ? generados.map(() => '?').join(', ') : 'NULL';
  const [limpiados] = await pool.execute(
    `UPDATE alergenos SET icono = NULL
       WHERE icono IS NOT NULL AND icono NOT IN (${huecosGen})`,
    generados
  );
  if (limpiados.affectedRows > 0) {
    console.log(`
Limpiados ${limpiados.affectedRows} iconos que no eran ficheros reales.`);
  }

  const [sinIcono] = await pool.execute(
    'SELECT slug, nombre FROM alergenos WHERE icono IS NULL ORDER BY id'
  );
  if (sinIcono.length > 0) {
    console.log(`\nSiguen SIN imagen ${sinIcono.length} de ${alergenos.length}:`);
    for (const a of sinIcono) console.log(`  --  ${a.nombre}  (el fichero debe llamarse ${a.slug}.png)`);
    console.log('Mientras falten, en la carta salen como etiqueta de texto.');
  } else {
    console.log(`\nLos ${alergenos.length} alergenos tienen imagen.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
