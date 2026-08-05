import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import sharp from 'sharp';

import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { planoTexturizadoGlb } from '../lib/glb.js';

const SUBCARPETA = 'modelos';
const directorio = () => join(env.uploads.directorio, SUBCARPETA);

// Por debajo de esto no es un plato y por encima no cabe en una mesa. Sirve
// para cazar el dedo que teclea 250 en vez de 25.
const ANCHO_MINIMO_CM = 5;
const ANCHO_MAXIMO_CM = 120;

export async function obtenerPlatoAr(platoId) {
  const [filas] = await pool.execute(
    `SELECT id, nombre, imagen, ancho_cm, modelo_glb, modelo_usdz, activo
       FROM platos WHERE id = ? LIMIT 1`,
    [platoId]
  );
  const plato = filas[0];
  if (!plato || !plato.activo) throw ApiError.noEncontrado('Ese plato no existe');
  return plato;
}

/**
 * Estado de la vista en realidad aumentada de un plato.
 *
 * `modo` dice de donde sale el modelo:
 *   'modelo'  hay un escaneo 3D subido a mano
 *   'foto'    se genera un plano a escala con la foto
 *   null      falta la medida o la foto, y no se puede ofrecer
 */
export function estadoAr(plato) {
  const ancho = plato.ancho_cm === null ? null : Number(plato.ancho_cm);

  if (plato.modelo_glb) {
    return { disponible: true, modo: 'modelo', ancho_cm: ancho, usdz: plato.modelo_usdz };
  }
  if (plato.imagen && ancho) {
    return { disponible: true, modo: 'foto', ancho_cm: ancho, usdz: null };
  }
  return {
    disponible: false,
    modo: null,
    ancho_cm: ancho,
    usdz: null,
    falta: !plato.imagen ? 'foto' : 'medida',
  };
}

/**
 * Devuelve el GLB del plato, generandolo desde la foto si hace falta.
 *
 * El resultado se cachea en disco con un nombre derivado de la foto y de la
 * medida: si cambia cualquiera de las dos, cambia el nombre y se regenera
 * solo. Un GLB de estos son unos 100 KB y se pide desde el movil del cliente
 * en mitad del servicio, asi que no conviene rehacerlo en cada visita.
 */
export async function glbDelPlato(platoId) {
  const plato = await obtenerPlatoAr(platoId);
  const estado = estadoAr(plato);

  if (!estado.disponible) {
    throw ApiError.noEncontrado(
      estado.falta === 'foto'
        ? 'Ese plato todavia no tiene foto'
        : 'Ese plato todavia no tiene medida'
    );
  }

  if (estado.modo === 'modelo') {
    return { ruta: plato.modelo_glb, generado: false };
  }

  const anchoCm = Number(plato.ancho_cm);
  if (anchoCm < ANCHO_MINIMO_CM || anchoCm > ANCHO_MAXIMO_CM) {
    throw ApiError.peticionInvalida(
      `La medida de ${anchoCm} cm no parece un plato. Revisala en el panel.`
    );
  }

  await mkdir(directorio(), { recursive: true });

  const huella = createHash('sha1')
    .update(`${plato.imagen}|${anchoCm}`)
    .digest('hex')
    .slice(0, 12);
  const nombre = `plato-${platoId}-${huella}.glb`;
  const destino = join(directorio(), nombre);

  try {
    await readFile(destino);
    return { ruta: `/uploads/${SUBCARPETA}/${nombre}`, generado: false };
  } catch {
    // No estaba cacheado: se genera.
  }

  const origen = join(env.uploads.directorio, 'platos', basename(plato.imagen));
  const original = await readFile(origen).catch(() => {
    throw ApiError.noEncontrado('No se encuentra la foto del plato en disco');
  });

  // glTF admite PNG y JPEG; WebP necesitaria la extension EXT_texture_webp,
  // que no soportan todos los visores de AR. Se convierte.
  const png = await sharp(original).png({ compressionLevel: 9 }).toBuffer();
  const meta = await sharp(png).metadata();

  const anchoM = anchoCm / 100;
  const altoM = anchoM * (meta.height / meta.width);

  const glb = planoTexturizadoGlb(png, {
    anchoM,
    altoM,
    tipoImagen: 'image/png',
    nombre: plato.nombre,
  });

  await writeFile(destino, glb);
  return { ruta: `/uploads/${SUBCARPETA}/${nombre}`, generado: true };
}
