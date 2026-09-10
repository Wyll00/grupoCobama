import { estadoDelSistema } from '../services/estado.service.js';

/**
 * Que esta conectado y que no.
 *
 * Solo admin_grupo: dice que integraciones hay y como esta configurado el
 * correo. No son secretos -nunca sale una clave- pero tampoco es informacion
 * que le sirva de nada al encargado de una casa, y en una pantalla que se
 * mira con prisa lo que no sirve estorba.
 */
export async function getEstado(req, res) {
  res.json({ datos: await estadoDelSistema() });
}
