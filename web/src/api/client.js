const BASE = '/api';

class ErrorApi extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
  }
}

async function get(ruta, params = {}, { signal } = {}) {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '' || valor === false) continue;
    query.set(clave, Array.isArray(valor) ? valor.join(',') : String(valor));
  }

  const sufijo = query.toString() ? `?${query}` : '';
  const res = await fetch(`${BASE}${ruta}${sufijo}`, { signal });

  const cuerpo = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ErrorApi(cuerpo?.error?.mensaje ?? `Error ${res.status}`, res.status);
  }
  return cuerpo.datos;
}

export const api = {
  restaurantes: (opts) => get('/restaurantes', {}, opts),
  restaurante: (slug, opts) => get(`/restaurantes/${slug}`, {}, opts),
  carta: (slug, filtros, opts) => get(`/restaurantes/${slug}/carta`, filtros, opts),
  destacados: (slug, opts) => get(`/restaurantes/${slug}/destacados`, {}, opts),
  categorias: (opts) => get('/categorias', {}, opts),
  alergenos: (opts) => get('/alergenos', {}, opts),
  menusCelebracion: (opts) => get('/menus-celebracion', {}, opts),
  ar: (platoId, opts) => get(`/platos/${platoId}/ar`, {}, opts),
  galeria: (slug, categoria, opts) =>
    get(slug ? `/restaurantes/${slug}/galeria` : '/galeria', { categoria }, opts),

  tramosReserva: (restauranteId, fecha, opts) =>
    get('/reservas/tramos', { restaurante_id: restauranteId, fecha }, opts),

  crearReserva: async (datos) => {
    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const error = new Error(json?.error?.mensaje ?? 'No se ha podido enviar la reserva');
      error.detalles = json?.error?.detalles ?? [];
      throw error;
    }
    return json.datos;
  },
};
