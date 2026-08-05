import { env } from '../config/env.js';
import * as auth from '../services/auth.service.js';
import * as usuarios from '../services/usuarios.service.js';
import { ApiError } from '../utils/ApiError.js';

const contexto = (req) => ({
  userAgent: req.get('user-agent'),
  ip: req.ip,
});

function ponerCookie(res, { token, expira }) {
  res.cookie(env.cookie.nombre, token, {
    ...env.cookie.opciones,
    expires: expira,
  });
}

export async function postLogin(req, res) {
  const { usuario, acceso, refresco } = await auth.login(req.body, contexto(req));
  ponerCookie(res, refresco);
  res.json({ datos: { usuario, acceso } });
}

export async function postRefresh(req, res) {
  const token = req.cookies?.[env.cookie.nombre];
  const { usuario, acceso, refresco } = await auth.refrescar(token, contexto(req));
  // refresco viene a null cuando el servicio detecta una carrera y decide no
  // rotar: en ese caso la cookie buena ya esta puesta y no hay que tocarla.
  if (refresco) ponerCookie(res, refresco);
  res.json({ datos: { usuario, acceso } });
}

export async function postLogout(req, res) {
  await auth.revocar(req.cookies?.[env.cookie.nombre]);
  res.clearCookie(env.cookie.nombre, env.cookie.opciones);
  res.status(204).end();
}

export async function getYo(req, res) {
  const usuario = await auth.obtenerUsuario(req.usuario.id);
  if (!usuario || !usuario.activo) throw ApiError.noAutenticado('Usuario desactivado');
  res.json({ datos: usuario });
}

export async function postCambiarPassword(req, res) {
  await usuarios.cambiarPasswordPropia(req.usuario.id, req.body);
  res.clearCookie(env.cookie.nombre, env.cookie.opciones);
  res.status(204).end();
}
