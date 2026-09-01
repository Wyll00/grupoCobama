import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validarCuerpo, validarConsulta } from '../middleware/validar.js';
import {
  autenticar,
  exigirRol,
  ambitoLocal,
  ambitoCartaItem,
  ambitoReserva,
  ambitoPlato,
  ambitoFoto,
} from '../middleware/auth.js';
import { manejarSubida } from '../middleware/subida.js';

import {
  crearPlatoSchema,
  actualizarPlatoSchema,
  listarPlatosSchema,
  anadirACartaSchema,
  actualizarCartaItemSchema,
  reordenarSchema,
  crearPlatoEnCartaSchema,
  crearCategoriaSchema,
  actualizarCategoriaSchema,
} from '../esquemas/catalogo.js';
import { crearUsuarioSchema, actualizarUsuarioSchema } from '../esquemas/usuarios.js';
import {
  registrarOcupacionSchema,
  consultaOcupacionSchema,
} from '../esquemas/ocupacion.js';

import * as platosCtrl from '../controllers/admin.platos.controller.js';
import * as cartaCtrl from '../controllers/admin.carta.controller.js';
import * as usuariosCtrl from '../controllers/admin.usuarios.controller.js';
import * as categoriasCtrl from '../controllers/admin.categorias.controller.js';
import * as ocupacionCtrl from '../controllers/admin.ocupacion.controller.js';
import * as reservasCtrl from '../controllers/reservas.controller.js';
import * as localesCtrl from '../controllers/admin.locales.controller.js';
import * as galeriaCtrl from '../controllers/admin.galeria.controller.js';
import * as resumenCtrl from '../controllers/admin.resumen.controller.js';
import {
  actualizarFotoSchema,
  reordenarGaleriaSchema,
} from '../esquemas/galeria.js';
import { actualizarLocalSchema } from '../esquemas/locales.js';
import {
  crearReservaManualSchema,
  actualizarReservaSchema,
  listarReservasSchema,
} from '../esquemas/reservas.js';

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

// Lo que falta por rematar en la carta, para la portada del panel. Va sin
// validacion de consulta porque no acepta parametros: el alcance sale del
// token, no de la peticion.
adminRouter.get('/resumen', asyncHandler(resumenCtrl.resumen));

adminRouter.get('/platos', validarConsulta(listarPlatosSchema), asyncHandler(platosCtrl.getPlatos));
adminRouter.get('/platos/:id', asyncHandler(platosCtrl.getPlato));

adminRouter.post(
  '/platos',
  soloAdmin,
  validarCuerpo(crearPlatoSchema),
  asyncHandler(platosCtrl.postPlato)
);
// Editar, retirar y poner foto: el admin siempre; un encargado solo si el
// plato lo sirve nada mas que su local. Ver ambitoPlato.
adminRouter.patch(
  '/platos/:id',
  ambitoPlato,
  validarCuerpo(actualizarPlatoSchema),
  asyncHandler(platosCtrl.patchPlato)
);
// Confirmar los alergenos: mismo ambito que editarlos. Un encargado puede
// firmar los platos que solo sirve su local, que son los que conoce.
adminRouter.post(
  '/platos/:id/confirmar-alergenos',
  ambitoPlato,
  asyncHandler(platosCtrl.postConfirmarAlergenos)
);

adminRouter.delete('/platos/:id', ambitoPlato, asyncHandler(platosCtrl.deletePlato));

adminRouter.post('/platos/:id/imagen', ambitoPlato, manejarSubida, asyncHandler(platosCtrl.postImagen));
adminRouter.delete('/platos/:id/imagen', ambitoPlato, asyncHandler(platosCtrl.deleteImagen));

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

// Alta de un plato que no existe todavia, desde la propia carta. Lo puede
// hacer el encargado: es lo que pasa cuando entra un plato nuevo en su cocina.
// El plato nace sirviendolo solo su local, asi que sigue siendo suyo para
// editarlo mientras nadie mas lo ponga en carta.
adminRouter.post(
  '/restaurantes/:restauranteId/carta/nuevo-plato',
  ambitoLocal(),
  validarCuerpo(crearPlatoEnCartaSchema),
  asyncHandler(cartaCtrl.postPlatoNuevo)
);

// Ajustes del local. Mismo ambito que la portada: un encargado toca el suyo.
adminRouter.patch(
  '/restaurantes/:restauranteId',
  ambitoLocal(),
  validarCuerpo(actualizarLocalSchema),
  asyncHandler(localesCtrl.patchLocal)
);

// Foto de portada del local, la que va de fondo en la cabecera de su ficha.
adminRouter.post(
  '/restaurantes/:restauranteId/portada',
  ambitoLocal(),
  manejarSubida,
  asyncHandler(localesCtrl.postPortada)
);
adminRouter.delete(
  '/restaurantes/:restauranteId/portada',
  ambitoLocal(),
  asyncHandler(localesCtrl.deletePortada)
);

// ---------------------------------------------------------------------------
// Galeria
//
// Un encargado lleva la de su casa. Las fotos del grupo salen en la galeria
// general Y en las cuatro casas, asi que esas son cosa de la administracion.
// ---------------------------------------------------------------------------
adminRouter.get(
  '/restaurantes/:restauranteId/galeria',
  ambitoLocal(),
  asyncHandler(galeriaCtrl.getGaleriaLocal)
);
adminRouter.post(
  '/restaurantes/:restauranteId/galeria',
  ambitoLocal(),
  manejarSubida,
  asyncHandler(galeriaCtrl.postFotoLocal)
);
adminRouter.post(
  '/restaurantes/:restauranteId/galeria/orden',
  ambitoLocal(),
  validarCuerpo(reordenarGaleriaSchema),
  asyncHandler(galeriaCtrl.postOrdenLocal)
);

adminRouter.get('/galeria', soloAdmin, asyncHandler(galeriaCtrl.getGaleriaGrupo));
adminRouter.post('/galeria', soloAdmin, manejarSubida, asyncHandler(galeriaCtrl.postFotoGrupo));
adminRouter.post(
  '/galeria/orden',
  soloAdmin,
  validarCuerpo(reordenarGaleriaSchema),
  asyncHandler(galeriaCtrl.postOrdenGrupo)
);

// Por id: el ambito sale de la propia foto, no de la URL.
adminRouter.patch(
  '/galeria/:id',
  ambitoFoto,
  validarCuerpo(actualizarFotoSchema),
  asyncHandler(galeriaCtrl.patchFoto)
);
adminRouter.delete('/galeria/:id', ambitoFoto, asyncHandler(galeriaCtrl.deleteFoto));

// QR de la carta publica del local, para imprimir o publicar.
adminRouter.get(
  '/restaurantes/:restauranteId/qr',
  ambitoLocal(),
  asyncHandler(cartaCtrl.getQr)
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
// Reservas
// ---------------------------------------------------------------------------
adminRouter.get(
  '/restaurantes/:restauranteId/reservas',
  ambitoLocal(),
  validarConsulta(listarReservasSchema),
  asyncHandler(reservasCtrl.getReservas)
);
adminRouter.get(
  '/restaurantes/:restauranteId/reservas/resumen',
  ambitoLocal(),
  validarConsulta(listarReservasSchema),
  asyncHandler(reservasCtrl.getResumen)
);
adminRouter.post(
  '/restaurantes/:restauranteId/reservas',
  ambitoLocal(),
  validarCuerpo(crearReservaManualSchema),
  asyncHandler(reservasCtrl.postReservaManual)
);
// El local sale de la propia reserva, no de la URL.
adminRouter.patch(
  '/reservas/:id',
  ambitoReserva,
  validarCuerpo(actualizarReservaSchema),
  asyncHandler(reservasCtrl.patchReserva)
);

// Reintento a mano del envio a CoverManager, para cuando sala ve el aviso en
// el panel y ya se ha arreglado lo que fallaba.
adminRouter.post(
  '/reservas/:id/reenviar-covermanager',
  ambitoReserva,
  asyncHandler(reservasCtrl.postReenviarCoverManager)
);

// ---------------------------------------------------------------------------
// Ocupacion del local
//
// Lo responde sala desde el comandero, asi que va por ambito de local: cada
// casa registra la suya y el admin ve las cuatro.
// ---------------------------------------------------------------------------
adminRouter.get(
  '/restaurantes/:restauranteId/ocupacion/pendiente',
  ambitoLocal(),
  asyncHandler(ocupacionCtrl.getPendiente)
);
adminRouter.post(
  '/restaurantes/:restauranteId/ocupacion',
  ambitoLocal(),
  validarCuerpo(registrarOcupacionSchema),
  asyncHandler(ocupacionCtrl.postOcupacion)
);
adminRouter.get(
  '/restaurantes/:restauranteId/ocupacion',
  ambitoLocal(),
  validarConsulta(consultaOcupacionSchema),
  asyncHandler(ocupacionCtrl.getHistorico)
);
adminRouter.get(
  '/restaurantes/:restauranteId/ocupacion/patron',
  ambitoLocal(),
  validarConsulta(consultaOcupacionSchema),
  asyncHandler(ocupacionCtrl.getPatron)
);

// ---------------------------------------------------------------------------
// Categorias - las lee cualquiera, las toca el admin
// ---------------------------------------------------------------------------
adminRouter.get('/categorias', asyncHandler(categoriasCtrl.getCategorias));
adminRouter.post(
  '/categorias',
  soloAdmin,
  validarCuerpo(crearCategoriaSchema),
  asyncHandler(categoriasCtrl.postCategoria)
);
adminRouter.put(
  '/categorias/orden',
  soloAdmin,
  validarCuerpo(reordenarSchema),
  asyncHandler(categoriasCtrl.putOrdenCategorias)
);
adminRouter.patch(
  '/categorias/:id',
  soloAdmin,
  validarCuerpo(actualizarCategoriaSchema),
  asyncHandler(categoriasCtrl.patchCategoria)
);
adminRouter.delete('/categorias/:id', soloAdmin, asyncHandler(categoriasCtrl.deleteCategoria));

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
