import { mkdir, unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SUBCARPETA = 'platos';
const RUTA_PUBLICA = `/uploads/${SUBCARPETA}`;

// 4:3, que es la proporcion con la que se muestran las fichas de plato.
const GRANDE = { ancho: 1200, alto: 900 };
const MINIATURA = { ancho: 400, alto: 300 };

const directorio = () => join(env.uploads.directorio, SUBCARPETA);

/**
 * Procesa la imagen de un plato y devuelve las rutas publicas.
 *
 * Se guarda en webp y en dos tamanos: la carta se ve casi siempre desde el
 * movil con datos, y servir el JPEG original de 4 MB que sale de un telefono
 * no es una opcion.
 *
 * `recorte` viene en pixeles de la imagen ORIGINAL, tal cual lo calcula el
 * panel sobre la previsualizacion.
 */
export async function procesarImagenPlato(platoId, buffer, recorte) {
  await mkdir(directorio(), { recursive: true });

  // rotate() sin argumentos aplica la orientacion EXIF: sin esto, las fotos
  // hechas en vertical con el movil salen tumbadas.
  const base = sharp(buffer, { failOn: 'error' }).rotate();

  const metadatos = await base.metadata().catch(() => null);
  if (!metadatos?.width || !metadatos?.height) {
    throw ApiError.peticionInvalida('El fichero no es una imagen valida');
  }

  let pipeline = base;

  if (recorte) {
    const { x, y, ancho, alto } = recorte;
    if (x + ancho > metadatos.width || y + alto > metadatos.height) {
      throw ApiError.peticionInvalida('El recorte se sale de la imagen');
    }
    pipeline = pipeline.extract({ left: x, top: y, width: ancho, height: alto });
  }

  const sufijo = `${platoId}-${Date.now()}-${randomBytes(4).toString('hex')}`;
  const nombreGrande = `plato-${sufijo}.webp`;
  const nombreThumb = `plato-${sufijo}-thumb.webp`;

  const escribir = (nombre, { ancho, alto }, calidad) =>
    pipeline
      .clone()
      .resize(ancho, alto, { fit: 'cover', position: 'attention' })
      .webp({ quality: calidad })
      .toFile(join(directorio(), nombre));

  await escribir(nombreGrande, GRANDE, 82);
  await escribir(nombreThumb, MINIATURA, 78);

  return {
    imagen: `${RUTA_PUBLICA}/${nombreGrande}`,
    thumb: `${RUTA_PUBLICA}/${nombreThumb}`,
    original: { ancho: metadatos.width, alto: metadatos.height },
  };
}

/**
 * Borra los ficheros de una imagen sustituida. Que falle no debe tumbar la
 * peticion: un fichero huerfano es un problema de limpieza, no de datos.
 */
export async function borrarImagenes(...rutas) {
  for (const ruta of rutas) {
    if (!ruta?.startsWith(RUTA_PUBLICA)) continue;
    try {
      await unlink(join(directorio(), basename(ruta)));
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn(`[imagenes] no se pudo borrar ${ruta}: ${err.message}`);
      }
    }
  }
}
