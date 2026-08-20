/**
 * Cliente HTTP del panel.
 *
 * El access token vive SOLO en memoria de este modulo, nunca en localStorage:
 * asi un XSS no puede leerlo. La sesion se sostiene con la cookie httpOnly de
 * refresco, que el navegador manda sola y JavaScript no ve.
 */
const BASE = '/api';

let acceso = null;
let pedirRefresco = null;
let refrescoEnCurso = null;

export const fijarAcceso = (token) => {
  acceso = token;
};

export const registrarRefresco = (fn) => {
  pedirRefresco = fn;
};

export class ErrorApi extends Error {
  constructor(mensaje, status, detalles) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.detalles = detalles ?? [];
  }

  /** 'nombre: minimo 2 caracteres · precio: obligatorio' */
  get detalle() {
    return this.detalles.map((d) => `${d.campo}: ${d.mensaje}`).join(' · ');
  }
}

/**
 * Un unico refresco compartido: si tres peticiones fallan con 401 a la vez,
 * no se lanzan tres refrescos que se invalidarian entre si por la rotacion.
 */
function refrescarUnaVez() {
  if (!refrescoEnCurso) {
    refrescoEnCurso = pedirRefresco().finally(() => {
      refrescoEnCurso = null;
    });
  }
  return refrescoEnCurso;
}

async function peticion(metodo, ruta, { cuerpo, formData, signal, reintentar = true } = {}) {
  const cabeceras = {};
  if (acceso) cabeceras.authorization = `Bearer ${acceso}`;
  // Con FormData el navegador pone el content-type con su boundary.
  if (cuerpo !== undefined) cabeceras['content-type'] = 'application/json';

  const res = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    credentials: 'include',
    body: formData ?? (cuerpo === undefined ? undefined : JSON.stringify(cuerpo)),
    signal,
  });

  if (res.status === 401 && reintentar && pedirRefresco && !ruta.startsWith('/auth')) {
    const nuevo = await refrescarUnaVez();
    if (nuevo) {
      acceso = nuevo;
      return peticion(metodo, ruta, { cuerpo, formData, signal, reintentar: false });
    }
  }

  if (res.status === 204) return null;

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ErrorApi(
      json?.error?.mensaje ?? `Error ${res.status}`,
      res.status,
      json?.error?.detalles
    );
  }

  return json;
}

// Toda la API responde { datos: ... }. Los metodos desenvuelven ese sobre para
// que los componentes no acaben escribiendo respuesta.datos.datos.
const contenido = (promesa) => promesa.then((json) => json?.datos ?? null);

const get = (ruta, opts) => contenido(peticion('GET', ruta, opts));
const enviar = (metodo, ruta, opts) => contenido(peticion(metodo, ruta, opts));

export const adminApi = {
  // --- sesion -------------------------------------------------------------
  login: (email, password) =>
    peticion('POST', '/auth/login', { cuerpo: { email, password }, reintentar: false }),
  refrescar: () => peticion('POST', '/auth/refresh', { reintentar: false }),
  salir: () => peticion('POST', '/auth/logout', { reintentar: false }),
  yo: () => get('/auth/yo'),
  cambiarPassword: (passwordActual, passwordNueva) =>
    peticion('POST', '/auth/password', { cuerpo: { passwordActual, passwordNueva } }),

  // --- catalogo publico de apoyo -----------------------------------------
  restaurantes: () => get('/restaurantes'),
  categorias: () => get('/categorias'),
  alergenos: () => get('/alergenos'),

  // --- catalogo maestro ---------------------------------------------------
  // Unico metodo que NO desenvuelve: el listado necesita tambien `paginacion`.
  platos: (filtros = {}) => {
    const query = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== '' && v != null)
    );
    return peticion('GET', `/admin/platos${query.toString() ? `?${query}` : ''}`);
  },
  plato: (id) => get(`/admin/platos/${id}`),
  crearPlato: (datos) => enviar('POST', '/admin/platos', { cuerpo: datos }),
  editarPlato: (id, datos) => enviar('PATCH', `/admin/platos/${id}`, { cuerpo: datos }),
  desactivarPlato: (id) => enviar('DELETE', `/admin/platos/${id}`),
  confirmarAlergenos: (id) => enviar('POST', `/admin/platos/${id}/confirmar-alergenos`),

  subirImagen: (id, formData) => enviar('POST', `/admin/platos/${id}/imagen`, { formData }),
  quitarImagen: (id) => enviar('DELETE', `/admin/platos/${id}/imagen`),

  // --- categorias ---------------------------------------------------------
  categoriasAdmin: () => get('/admin/categorias'),
  crearCategoria: (datos) => enviar('POST', '/admin/categorias', { cuerpo: datos }),
  editarCategoria: (id, datos) => enviar('PATCH', `/admin/categorias/${id}`, { cuerpo: datos }),
  borrarCategoria: (id) => enviar('DELETE', `/admin/categorias/${id}`),
  reordenarCategorias: (orden) =>
    enviar('PUT', '/admin/categorias/orden', { cuerpo: { orden } }),

  // --- carta por local ----------------------------------------------------
  carta: (restauranteId) => get(`/admin/restaurantes/${restauranteId}/carta`),
  cartaDisponibles: (restauranteId) =>
    get(`/admin/restaurantes/${restauranteId}/carta/disponibles`),
  anadirACarta: (restauranteId, datos) =>
    enviar('POST', `/admin/restaurantes/${restauranteId}/carta`, { cuerpo: datos }),
  // Crea el plato en el catalogo del grupo y lo mete en esta carta de una vez.
  crearPlatoEnCarta: (restauranteId, datos) =>
    enviar('POST', `/admin/restaurantes/${restauranteId}/carta/nuevo-plato`, { cuerpo: datos }),
  qr: (restauranteId) => get(`/admin/restaurantes/${restauranteId}/qr`),

  // --- portada del local --------------------------------------------------
  subirPortada: (restauranteId, formData) =>
    enviar('POST', `/admin/restaurantes/${restauranteId}/portada`, { formData }),
  quitarPortada: (restauranteId) =>
    enviar('DELETE', `/admin/restaurantes/${restauranteId}/portada`),

  // --- reservas -----------------------------------------------------------
  reservas: (restauranteId, filtros = {}) => {
    const query = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== '' && v != null)
    );
    return get(`/admin/restaurantes/${restauranteId}/reservas?${query}`);
  },
  resumenReservas: (restauranteId, fecha) =>
    get(`/admin/restaurantes/${restauranteId}/reservas/resumen?desde=${fecha}`),
  crearReserva: (restauranteId, datos) =>
    enviar('POST', `/admin/restaurantes/${restauranteId}/reservas`, { cuerpo: datos }),
  editarReserva: (id, datos) => enviar('PATCH', `/admin/reservas/${id}`, { cuerpo: datos }),

  // --- ocupacion ----------------------------------------------------------
  ocupacionPendiente: (restauranteId) =>
    get(`/admin/restaurantes/${restauranteId}/ocupacion/pendiente`),
  registrarOcupacion: (restauranteId, datos) =>
    enviar('POST', `/admin/restaurantes/${restauranteId}/ocupacion`, { cuerpo: datos }),
  ocupacionHistorico: (restauranteId, dias = 14) =>
    get(`/admin/restaurantes/${restauranteId}/ocupacion?dias=${dias}`),
  ocupacionPatron: (restauranteId, dias = 90) =>
    get(`/admin/restaurantes/${restauranteId}/ocupacion/patron?dias=${dias}`),
  editarItem: (id, datos) => enviar('PATCH', `/admin/carta-items/${id}`, { cuerpo: datos }),
  quitarItem: (id) => enviar('DELETE', `/admin/carta-items/${id}`),
  reordenar: (restauranteId, orden) =>
    enviar('PUT', `/admin/restaurantes/${restauranteId}/carta/orden`, { cuerpo: { orden } }),
  historico: (id) => get(`/admin/carta-items/${id}/historico`),

  // --- usuarios -----------------------------------------------------------
  usuarios: () => get('/admin/usuarios'),
  crearUsuario: (datos) => enviar('POST', '/admin/usuarios', { cuerpo: datos }),
  editarUsuario: (id, datos) => enviar('PATCH', `/admin/usuarios/${id}`, { cuerpo: datos }),
  desactivarUsuario: (id) => enviar('DELETE', `/admin/usuarios/${id}`),
};
