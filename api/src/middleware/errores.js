import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function noEncontrado(req, res) {
  res.status(404).json({ error: { mensaje: `Ruta no encontrada: ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars -- Express identifica el handler de
// errores por su aridad de 4 argumentos.
export function manejadorErrores(err, req, res, next) {
  const esConocido = err instanceof ApiError;
  const status = esConocido ? err.status : 500;

  if (!esConocido) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: {
      mensaje: esConocido ? err.message : 'Error interno del servidor',
      detalles: esConocido ? err.detalles : undefined,
      stack: env.isProd ? undefined : err.stack,
    },
  });
}
