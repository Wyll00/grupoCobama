import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verificarAcceso } from '../services/auth.service.js';

/**
 * Exige un access token valido y deja el usuario en req.usuario.
 */
export const autenticar = asyncHandler(async (req, res, next) => {
  const cabecera = req.get('authorization') ?? '';
  const [esquema, token] = cabecera.split(' ');

  if (esquema !== 'Bearer' || !token) {
    throw ApiError.noAutenticado();
  }

  const payload = verificarAcceso(token);
  req.usuario = {
    id: Number(payload.sub),
    rol: payload.rol,
    restaurante_id: payload.restaurante_id ?? null,
  };

  next();
});

/** Restringe la ruta a los roles indicados. */
export const exigirRol = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      throw ApiError.prohibido(
        `Esta operacion requiere el rol ${roles.join(' o ')}`
      );
    }
    next();
  });

/**
 * Resuelve sobre que local actua la peticion y lo deja en req.restauranteId.
 *
 * Este es el limite real del multi-tenant. Un encargado NUNCA puede tocar otro
 * local aunque cambie el id en la URL: se compara contra el `restaurante_id`
 * que va firmado dentro del token, no contra nada que mande el cliente.
 *
 * `obtenerId` extrae el id solicitado de la peticion (params, body o query).
 */
export const ambitoLocal = (obtenerId = (req) => req.params.restauranteId) =>
  asyncHandler(async (req, res, next) => {
    const solicitado = Number(obtenerId(req));

    if (req.usuario.rol === 'admin_grupo') {
      if (!Number.isInteger(solicitado) || solicitado <= 0) {
        throw ApiError.peticionInvalida('Falta indicar el local');
      }
      req.restauranteId = solicitado;
      return next();
    }

    if (!req.usuario.restaurante_id) {
      throw ApiError.prohibido('Tu usuario no tiene local asignado');
    }

    if (Number.isInteger(solicitado) && solicitado !== req.usuario.restaurante_id) {
      throw ApiError.prohibido('Solo puedes gestionar tu propio local');
    }

    req.restauranteId = req.usuario.restaurante_id;
    next();
  });

/**
 * Igual que ambitoCartaItem pero para una reserva: el local se deduce de la
 * propia reserva, no de la URL.
 */
export const ambitoReserva = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.peticionInvalida('Identificador de reserva invalido');
  }

  const [filas] = await pool.execute(
    'SELECT id, restaurante_id FROM reservas WHERE id = ? LIMIT 1',
    [id]
  );

  const reserva = filas[0];
  // Mismo 404 si no existe que si es de otro local: no hay por que confirmarle
  // a un encargado que existe una reserva en la casa de al lado.
  if (
    !reserva ||
    (req.usuario.rol !== 'admin_grupo' && reserva.restaurante_id !== req.usuario.restaurante_id)
  ) {
    throw ApiError.noEncontrado('Esa reserva no existe');
  }

  req.restauranteId = reserva.restaurante_id;
  next();
});

/**
 * Igual que ambitoLocal pero partiendo de un carta_item: primero averigua a
 * que local pertenece y despues comprueba el permiso.
 */
export const ambitoCartaItem = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.peticionInvalida('Identificador de carta invalido');
  }

  const [filas] = await pool.execute(
    'SELECT id, restaurante_id FROM carta_items WHERE id = ? LIMIT 1',
    [id]
  );

  const item = filas[0];
  if (!item) throw ApiError.noEncontrado('Ese plato no esta en ninguna carta');

  if (
    req.usuario.rol !== 'admin_grupo' &&
    item.restaurante_id !== req.usuario.restaurante_id
  ) {
    // Mismo mensaje que si no existiera: no hay por que confirmar a un
    // encargado que ese item existe en otro local.
    throw ApiError.noEncontrado('Ese plato no esta en ninguna carta');
  }

  req.cartaItem = item;
  req.restauranteId = item.restaurante_id;
  next();
});
