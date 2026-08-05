import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * La imagen se recibe en memoria porque sharp la procesa al vuelo y nunca se
 * guarda el original: lo que va a disco es siempre la version ya recortada y
 * convertida a webp.
 */
export const subirImagen = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.uploads.tamanoMaximoMb * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, cb) {
    if (!TIPOS.has(file.mimetype)) {
      return cb(
        ApiError.peticionInvalida(
          `Formato no admitido (${file.mimetype}). Usa JPG, PNG, WebP o AVIF.`
        )
      );
    }
    cb(null, true);
  },
}).single('imagen');

/** Traduce los errores de multer a ApiError. */
export const manejarSubida = (req, res, next) =>
  subirImagen(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          ApiError.peticionInvalida(
            `La imagen supera el maximo de ${env.uploads.tamanoMaximoMb} MB`
          )
        );
      }
      return next(ApiError.peticionInvalida(`Error al subir el fichero: ${err.message}`));
    }
    next(err);
  });
