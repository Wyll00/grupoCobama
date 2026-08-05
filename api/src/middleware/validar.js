import { ApiError } from '../utils/ApiError.js';

/**
 * Valida y NORMALIZA una parte de la peticion con un esquema de zod.
 * Se sustituye el original por el resultado del parseo, asi que a partir de
 * aqui el controlador trabaja con datos ya convertidos (numeros, booleanos)
 * y sin campos de mas.
 */
const validar = (parte) => (esquema) => (req, res, next) => {
  const resultado = esquema.safeParse(req[parte]);

  if (!resultado.success) {
    return next(
      ApiError.peticionInvalida(
        'Los datos enviados no son validos',
        resultado.error.issues.map((i) => ({
          campo: i.path.join('.') || parte,
          mensaje: i.message,
        }))
      )
    );
  }

  // req.query es de solo lectura en Express 5; en 4 se puede reasignar.
  if (parte === 'query') {
    req.consulta = resultado.data;
  } else {
    req[parte] = resultado.data;
  }
  next();
};

export const validarCuerpo = validar('body');
export const validarConsulta = validar('query');
