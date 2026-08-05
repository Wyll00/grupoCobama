import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { comprobarConexion } from '../config/db.js';
import {
  getRestaurantes,
  getRestaurante,
  getCarta,
} from '../controllers/restaurantes.controller.js';
import { getCategorias, getAlergenos } from '../controllers/catalogo.controller.js';
import { getAr } from '../controllers/ar.controller.js';

export const router = Router();

router.get('/health', asyncHandler(async (req, res) => {
  await comprobarConexion();
  res.json({ estado: 'ok', bd: 'ok', hora: new Date().toISOString() });
}));

router.get('/restaurantes', asyncHandler(getRestaurantes));
router.get('/restaurantes/:slug', asyncHandler(getRestaurante));
router.get('/restaurantes/:slug/carta', asyncHandler(getCarta));

router.get('/categorias', asyncHandler(getCategorias));
router.get('/alergenos', asyncHandler(getAlergenos));

// Ver el plato en la mesa. Publico: lo pide el cliente desde su movil.
router.get('/platos/:id/ar', asyncHandler(getAr));
