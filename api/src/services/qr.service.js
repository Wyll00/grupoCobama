import QRCode from 'qrcode';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const OPCIONES = {
  // Nivel M: aguanta que se manche o se raye un poco el adhesivo de la mesa
  // sin dejar de leerse. Subir a Q o H engorda el codigo sin necesidad real.
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#1f1a17', light: '#ffffff' },
};

export const urlCarta = (slug) => `${env.webBaseUrl.replace(/\/$/, '')}/${slug}/carta`;

/**
 * QR de la carta de un local, en SVG y PNG a la vez.
 *
 * Se devuelven los dos en el cuerpo JSON en lugar de servir la imagen: asi el
 * panel puede pintarlo y ofrecer las dos descargas sin volver a pedir nada, y
 * sin el lio de meter el token de sesion en un <img src>.
 *
 * El SVG es el que hay que llevar a imprenta: escala a cualquier tamano, desde
 * un adhesivo de mesa hasta un cartel.
 */
export async function generarQr(restauranteId, { tamano = 1024 } = {}) {
  const [filas] = await pool.execute(
    'SELECT slug, nombre FROM restaurantes WHERE id = ? AND activo = 1 LIMIT 1',
    [restauranteId]
  );

  const local = filas[0];
  if (!local) throw ApiError.noEncontrado('Ese local no existe');

  const url = urlCarta(local.slug);

  const [svg, png] = await Promise.all([
    QRCode.toString(url, { ...OPCIONES, type: 'svg' }),
    QRCode.toDataURL(url, { ...OPCIONES, width: tamano }),
  ]);

  return {
    restaurante: { id: restauranteId, nombre: local.nombre, slug: local.slug },
    url,
    svg,
    png,
    // Si esto sale con localhost, el QR impreso no le sirve a nadie.
    listoParaImprimir: !/localhost|127\.0\.0\.1/.test(url),
  };
}
