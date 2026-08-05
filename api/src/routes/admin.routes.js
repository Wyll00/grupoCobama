import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validarCuerpo, validarConsulta } from '../middleware/validar.js';
import { autenticar, exigirRol, ambitoLocal, ambitoCartaItem } from '../middleware/auth.js';
import { manejarSubida } from '../middleware/subida.js';

import {
  crearPlatoSchema,
  actualizarPlatoSchema,
  listarPlatosSchema,
  anadirACartaSchema,
  actualizarCartaItemSchema,
  reordenarSchema,
} from '../esquemas/catalogo.js';
import { crearUsuarioSchema, actualizarUsuarioSchema } from '../esquemas/usuarios.js';

import * as platosCtrl from '../controllers/admin.platos.controller.js';
import * as cartaCtrl from '../controllers/admin.carta.controller.js';
import * as usuariosCtrl from '../controllers/admin.usuarios.controller.js';

export const adminRouter = Router();

// Todo lo que cuelga de /api/admin exige sesion.
adminRouter.use(autenticar);

// ---------------------------------------------------------------------------
// Catalogo maestro de platos
//
// Lo gestiona cocina central: solo admin_grupo escribe. Un encargado necesita
// poder LEERLO para anadir platos a su carta, pero no puede crear ni editar.
// ---------------------------------------------------------------------------
const soloAdmin = exigirRol('admin_grupo');

adminRouter.get('/platos', validarConsulta(listarPlatosSchema), asyncHandler(platosCtrl.getPlatos));
adminRouter.get('/platos/:id', asyncHandler(platosCtrl.getPlato));

adminRouter.post(
  '/platos',
  soloAdmin,
  validarCuerpo(crearPlatoSchema),
  asyncHandler(platosCtrl.postPlato)
);
adminRouter.patch(
  '/platos/:id',
  soloAdmin,
  validarCuerpo(actualizarPlatoSchema),
  asyncHandler(platosCtrl.patchPlato)
);
adminRouter.delete('/platos/:id', soloAdmin, asyncHandler(platosCtrl.deletePlato));

adminRouter.post('/platos/:id/imagen', soloAdmin, manejarSubida, asyncHandler(platosCtrl.postImagen));
adminRouter.delete('/platos/:id/imagen', soloAdmin, asyncHandler(platosCtrl.deleteImagen));

// ---------------------------------------------------------------------------
// Carta por local
//
// ambitoLocal es el limite del multi-tenant: un encargado solo llega a su
// propio restaurante_id aunque cambie el numero de la URL.
// ---------------------------------------------------------------------------
adminRouter.get(
  '/restaurantes/:restauranteId/carta',
  ambitoLocal(),
  asyncHandler(cartaCtrl.getCarta)
);
adminRouter.get(
  '/restaurantes/:restauranteId/carta/disponibles',
  ambitoLocal(),
  asyncHandler(cartaCtrl.getDisponibles)
);
adminRouter.post(
  '/restaurantes/:restauranteId/carta',
  ambitoLocal(),
  validarCuerpo(anadirACartaSchema),
  asyncHandler(cartaCtrl.postItem)
);
adminRouter.put(
  '/restaurantes/:restauranteId/carta/orden',
  ambitoLocal(),
  validarCuerpo(reordenarSchema),
  asyncHandler(cartaCtrl.putOrden)
);

// Aqui el ambito se deduce del propio carta_item, no de la URL.
adminRouter.patch(
  '/carta-items/:id',
  ambitoCartaItem,
  validarCuerpo(actualizarCartaItemSchema),
  asyncHandler(cartaCtrl.patchItem)
);
adminRouter.delete('/carta-items/:id', ambitoCartaItem, asyncHandler(cartaCtrl.deleteItem));
adminRouter.get('/carta-items/:id/historico', ambitoCartaItem, asyncHandler(cartaCtrl.getHistorico));

// ---------------------------------------------------------------------------
// Usuarios - solo admin de grupo
// ---------------------------------------------------------------------------
adminRouter.get('/usuarios', soloAdmin, asyncHandler(usuariosCtrl.getUsuarios));
adminRouter.get('/usuarios/:id', soloAdmin, asyncHandler(usuariosCtrl.getUsuario));
adminRouter.post(
  '/usuarios',
  soloAdmin,
  validarCuerpo(crearUsuarioSchema),
  asyncHandler(usuariosCtrl.postUsuario)
);
adminRouter.patch(
  '/usuarios/:id',
  soloAdmin,
  validarCuerpo(actualizarUsuarioSchema),
  asyncHandler(usuariosCtrl.patchUsuario)
);
adminRouter.delete('/usuarios/:id', soloAdmin, asyncHandler(usuariosCtrl.deleteUsuario));
