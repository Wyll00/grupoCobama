import { mkdir, unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const SUBCARPETA = 'platos';
const RUTA_PUBLICA = `/uploads/${SUBCARPETA}`;

const SUBCARPETA_PORTADAS = 'portadas';
const RUTA_PORTADAS = `/uploads/${SUBCARPETA_PORTADAS}`;

const SUBCARPETA_GALERIA = 'galeria';
const RUTA_GALERIA = `/uploads/${SUBCARPETA_GALERIA}`;

// Lado mayor. No se fija proporcion: en la galeria las fotos conservan su
// encuadre, que es justo lo que las hace mirables.
const GALERIA_GRANDE = 1600;
const GALERIA_THUMB = 600;

// Panoramica: va de fondo en la cabecera del local, detras del nombre.
const PORTADA = { ancho: 1920, alto: 1000 };
export const PROPORCION_PORTADA = PORTADA.ancho / PORTADA.alto;

// 4:3, que es la proporcion con la que se muestran las fichas de plato.
const GRANDE = { ancho: 1200, alto: 900 };
const MINIATURA = { ancho: 400, alto: 300 };

const directorio = () => join(env.uploads.directorio, SUBCARPETA);
const directorioPortadas = () => join(env.uploads.directorio, SUBCARPETA_PORTADAS);
const directorioGaleria = () => join(env.uploads.directorio, SUBCARPETA_GALERIA);

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

/**
 * Portada de un local: la foto que va de fondo en la cabecera de su ficha.
 *
 * Se comprime mas que las de plato (calidad 70) a proposito: va detras de una
 * capa oscura y con el nombre encima, asi que el detalle fino no se aprecia y
 * lo que si se nota es lo que tarda en cargar. Es la primera imagen de la
 * pagina, la que marca la sensacion de rapidez.
 */
export async function procesarPortada(restauranteId, buffer, recorte) {
  await mkdir(directorioPortadas(), { recursive: true });

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

  const nombre = `local-${restauranteId}-${Date.now()}-${randomBytes(4).toString('hex')}.webp`;

  await pipeline
    .resize(PORTADA.ancho, PORTADA.alto, { fit: 'cover', position: 'attention' })
    .webp({ quality: 70 })
    .toFile(join(directorioPortadas(), nombre));

  return { portada: `${RUTA_PORTADAS}/${nombre}` };
}

/** Borra una portada sustituida. Igual que con los platos, fallar no es grave. */
export async function borrarPortada(ruta) {
  if (!ruta?.startsWith(RUTA_PORTADAS)) return;
  try {
    await unlink(join(directorioPortadas(), basename(ruta)));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[imagenes] no se pudo borrar ${ruta}: ${err.message}`);
    }
  }
}

/**
 * Foto de galeria.
 *
 * A diferencia de las de plato y las portadas, esta NO se recorta a una
 * proporcion: se redimensiona sin deformar y se devuelven las medidas
 * resultantes. Un plato va a 4:3 porque tiene que cuadrar en una rejilla al
 * lado de un precio; en una galeria ese mismo recorte decapita a la gente y
 * parte los platos.
 *
 * `withoutEnlargement` para que una foto pequena no se estire: agrandar no
 * anade detalle, solo peso y una imagen borrosa.
 */
export async function procesarImagenGaleria(buffer) {
  await mkdir(directorioGaleria(), { recursive: true });

  const base = sharp(buffer, { failOn: 'error' }).rotate();
  const metadatos = await base.metadata().catch(() => null);
  if (!metadatos?.width || !metadatos?.height) {
    throw ApiError.peticionInvalida('El fichero no es una imagen valida');
  }

  const sufijo = `${Date.now()}-${randomBytes(5).toString('hex')}`;
  const nombreGrande = `foto-${sufijo}.webp`;
  const nombreThumb = `foto-${sufijo}-thumb.webp`;

  const grande = await base
    .clone()
    .resize(GALERIA_GRANDE, GALERIA_GRANDE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(join(directorioGaleria(), nombreGrande));

  await base
    .clone()
    .resize(GALERIA_THUMB, GALERIA_THUMB, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(join(directorioGaleria(), nombreThumb));

  // Las medidas salen de lo que ha escrito sharp, no de un calculo nuestro:
  // con `inside` el resultado depende de la proporcion de origen y de si se
  // ha aplicado withoutEnlargement, y equivocarse aqui devuelve una pagina
  // que da saltos al cargar.
  return {
    imagen: `${RUTA_GALERIA}/${nombreGrande}`,
    thumb: `${RUTA_GALERIA}/${nombreThumb}`,
    ancho: grande.width,
    alto: grande.height,
  };
}

/** Borra los dos ficheros de una foto de galeria. */
export async function borrarImagenGaleria(...rutas) {
  for (const ruta of rutas) {
    if (!ruta?.startsWith(RUTA_GALERIA)) continue;
    try {
      await unlink(join(directorioGaleria(), basename(ruta)));
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn(`[imagenes] no se pudo borrar ${ruta}: ${err.message}`);
      }
    }
  }
}
