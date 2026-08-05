import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validarCuerpo } from '../middleware/validar.js';
import { autenticar } from '../middleware/auth.js';
import { loginSchema, cambiarPasswordSchema } from '../esquemas/auth.js';
import {
  postLogin,
  postRefresh,
  postLogout,
  getYo,
  postCambiarPassword,
} from '../controllers/auth.controller.js';

export const authRouter = Router();

/**
 * Limites del login.
 *
 * Se cuentan solo los intentos FALLIDOS (skipSuccessfulRequests) y se reparte
 * en dos: uno estrecho por email y otro ancho por IP.
 *
 * Limitar solo por IP es un mal negocio aqui: los cuatro locales pueden salir
 * por la misma linea, y un limite bajo dejaria fuera a gente que solo se ha
 * equivocado al teclear. El limite por email es el que de verdad frena la
 * fuerza bruta contra una cuenta concreta; el de IP queda de red para el
 * barrido masivo.
 */
const respuesta = {
  error: { mensaje: 'Demasiados intentos. Prueba de nuevo en unos minutos.' },
};

const comun = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: respuesta,
};

const limitePorCuenta = rateLimit({
  ...comun,
  limit: 6,
  // ipKeyGenerator normaliza IPv6 a su prefijo /64: sin el, un atacante con
  // un rango IPv6 tendria una clave distinta por peticion.
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}|${String(req.body?.email ?? '').toLowerCase()}`,
});

const limitePorIp = rateLimit({ ...comun, limit: 40 });

authRouter.post(
  '/login',
  limitePorIp,
  limitePorCuenta,
  validarCuerpo(loginSchema),
  asyncHandler(postLogin)
);
authRouter.post('/refresh', asyncHandler(postRefresh));
authRouter.post('/logout', asyncHandler(postLogout));
authRouter.get('/yo', autenticar, asyncHandler(getYo));
authRouter.post(
  '/password',
  autenticar,
  validarCuerpo(cambiarPasswordSchema),
  asyncHandler(postCambiarPassword)
);
