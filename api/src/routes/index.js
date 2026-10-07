import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validarConsulta, validarCuerpo } from '../middleware/validar.js';
import { listarGaleriaSchema } from '../esquemas/galeria.js';
import { comprobarConexion } from '../config/db.js';
import { env } from '../config/env.js';
import {
  getRestaurantes,
  getRestaurante,
  getCarta,
  getGaleria,
  getDestacados,
} from '../controllers/restaurantes.controller.js';
import { getCategorias, getAlergenos } from '../controllers/catalogo.controller.js';
import { getMenusCelebracion } from '../controllers/menus.controller.js';
import { getAr } from '../controllers/ar.controller.js';
import { getTarjeta, postAlta, getManifiestoTarjeta } from '../controllers/socios.controller.js';
import { altaPublicaSchema } from '../esquemas/socios.js';

export const router = Router();

router.get('/health', asyncHandler(async (req, res) => {
  await comprobarConexion();
  res.json({ estado: 'ok', bd: 'ok', hora: new Date().toISOString() });
}));

router.get('/restaurantes', asyncHandler(getRestaurantes));
router.get('/restaurantes/:slug', asyncHandler(getRestaurante));
router.get('/restaurantes/:slug/carta', asyncHandler(getCarta));
router.get('/restaurantes/:slug/destacados', asyncHandler(getDestacados));
// Menus cerrados para grupos, los de ese local mas los del grupo entero.
router.get('/restaurantes/:slug/menus-celebracion', asyncHandler(getMenusCelebracion));
router.get('/restaurantes/:slug/galeria', validarConsulta(listarGaleriaSchema), asyncHandler(getGaleria));

// Galeria del grupo: todas las fotos, de las cuatro casas y las sueltas.
router.get('/galeria', validarConsulta(listarGaleriaSchema), asyncHandler(getGaleria));

// La tarjeta de socio. El QR tiene que abrirse en el movil de cualquiera sin
// instalar ni entrar en nada.
router.get('/socios/:codigo', asyncHandler(getTarjeta));

// El manifiesto de esa tarjeta, para que el icono de la pantalla de inicio
// abra SU tarjeta y no la portada. Uno por socio; ver el controlador.
router.get('/socios/:codigo/manifiesto.webmanifest', asyncHandler(getManifiestoTarjeta));

/*
  Hacerse socio desde la web.

  Es el unico sitio publico que ESCRIBE. Se puede dejar abierto porque una
  tarjeta recien hecha no vale nada -nace con cero visitas y solo el personal
  las apunta-, asi que lo peor que sale de aqui son filas basura, no premios
  regalados. El limite esta para eso y para nada mas.

  ---------------------------------------------------------------------------
  TREINTA POR HORA, Y NO CINCO.

  Empezo en cinco copiando el limite de las reservas, y eso estaba mal pensado:
  una reserva se hace desde el movil de uno, en su casa. Una tarjeta de socio
  se hace EN EL LOCAL, con el wifi de la casa, y por ese wifi sale todo el
  comedor con la misma IP publica. Con cinco, una mesa de seis que se hiciera
  la tarjeta a la vez se quedaba sin tarjeta a partir del quinto, y el mensaje
  que le salia -"se han hecho demasiadas tarjetas desde aqui"- parece una
  acusacion. Un limite que castiga justo el caso que quieres que pase no es un
  limite, es un error.

  Treinta sigue cortando a quien venga a llenar la tabla con un script y deja
  pasar al comedor entero.
  ---------------------------------------------------------------------------
*/
const limiteAltas = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // En desarrollo no se limita: todo sale de la misma maquina, asi que el
  // contador lo agota quien este probando y despues no hay forma de volver a
  // ver el formulario funcionando hasta que pase una hora.
  skip: () => env.nodeEnv !== 'production',
  message: {
    error: {
      mensaje:
        'Se han hecho demasiadas tarjetas desde aqui. Prueba mas tarde o pidela en el local.',
    },
  },
});

router.post('/socios', limiteAltas, validarCuerpo(altaPublicaSchema), asyncHandler(postAlta));

router.get('/categorias', asyncHandler(getCategorias));
router.get('/alergenos', asyncHandler(getAlergenos));

// Ver el plato en la mesa. Publico: lo pide el cliente desde su movil.
router.get('/platos/:id/ar', asyncHandler(getAr));
