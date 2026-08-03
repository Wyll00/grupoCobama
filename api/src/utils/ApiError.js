export class ApiError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }

  static noEncontrado(mensaje = 'Recurso no encontrado') {
    return new ApiError(404, mensaje);
  }

  static peticionInvalida(mensaje = 'Peticion invalida', detalles) {
    return new ApiError(400, mensaje, detalles);
  }
}
