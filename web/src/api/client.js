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
  categorias: (opts) => get('/categorias', {}, opts),
  alergenos: (opts) => get('/alergenos', {}, opts),
};
