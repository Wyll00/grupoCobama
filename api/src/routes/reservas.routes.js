import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validarCuerpo, validarConsulta } from '../middleware/validar.js';
import { crearReservaSchema, tramosSchema } from '../esquemas/reservas.js';
import { getTramos, postReserva } from '../controllers/reservas.controller.js';

export const reservasRouter = Router();

/**
 * Es un formulario publico sin captcha: sin limite, cualquiera puede llenar la
 * bandeja del local de reservas falsas en un minuto. Diez por hora e IP deja
 * pasar de sobra a una familia que reserva para varios dias y corta el chorro.
 */
const limite = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      mensaje:
        'Se han hecho demasiadas reservas desde aqui. Prueba mas tarde o llama al local.',
    },
  },
});

reservasRouter.get('/tramos', validarConsulta(tramosSchema), asyncHandler(getTramos));
reservasRouter.post('/', limite, validarCuerpo(crearReservaSchema), asyncHandler(postReserva));
