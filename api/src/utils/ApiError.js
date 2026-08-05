export class ApiError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }

  static peticionInvalida(mensaje = 'Peticion invalida', detalles) {
    return new ApiError(400, mensaje, detalles);
  }

  /** Falta identificarse o el token no vale. */
  static noAutenticado(mensaje = 'Necesitas iniciar sesion') {
    return new ApiError(401, mensaje);
  }

  /** Identificado, pero sin permiso para esto. */
  static prohibido(mensaje = 'No tienes permiso para esta operacion') {
    return new ApiError(403, mensaje);
  }

  static noEncontrado(mensaje = 'Recurso no encontrado') {
    return new ApiError(404, mensaje);
  }

  static conflicto(mensaje = 'El recurso ya existe') {
    return new ApiError(409, mensaje);
  }
}
