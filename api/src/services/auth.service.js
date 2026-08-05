import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const COSTE_BCRYPT = 10;

/**
 * Hash valido de un valor aleatorio, contra el que se compara cuando el email
 * no existe. Tiene que ser un hash bien formado: con uno invalido bcrypt sale
 * al instante y el tiempo de respuesta volveria a delatar que emails estan
 * dados de alta.
 */
const HASH_SENUELO = bcrypt.hashSync(randomBytes(16).toString('hex'), COSTE_BCRYPT);

/**
 * El refresh token se guarda hasheado con SHA-256, no con bcrypt: es un valor
 * aleatorio de 256 bits, no una contrasena de baja entropia, asi que un hash
 * lento no aporta nada y encarece cada renovacion.
 */
const hashear = (token) => createHash('sha256').update(token).digest('hex');

export const hashearPassword = (password) => bcrypt.hash(password, COSTE_BCRYPT);

function firmarAcceso(usuario) {
  return jwt.sign(
    {
      sub: usuario.id,
      rol: usuario.rol,
      restaurante_id: usuario.restaurante_id,
    },
    env.jwt.secreto,
    { expiresIn: env.jwt.duracionAcceso }
  );
}

export function verificarAcceso(token) {
  try {
    return jwt.verify(token, env.jwt.secreto);
  } catch {
    throw ApiError.noAutenticado('Sesion caducada o token invalido');
  }
}

const publico = (u) => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
  restaurante_id: u.restaurante_id,
});

async function emitirRefresco(usuarioId, { userAgent, ip } = {}) {
  const token = randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + env.jwt.duracionRefrescoDias * 86400_000);

  await pool.execute(
    `INSERT INTO refresh_tokens (usuario_id, token_hash, expira_en, user_agent, ip)
     VALUES (?, ?, ?, ?, ?)`,
    [usuarioId, hashear(token), expira, userAgent?.slice(0, 255) ?? null, ip ?? null]
  );

  return { token, expira };
}

export async function login({ email, password }, contexto = {}) {
  const [filas] = await pool.execute(
    `SELECT id, nombre, email, password_hash, rol, restaurante_id, activo
       FROM usuarios
      WHERE email = ?
      LIMIT 1`,
    [email]
  );

  const usuario = filas[0];

  // Se compara igualmente cuando el usuario no existe, para que el tiempo de
  // respuesta no delate que emails estan dados de alta.
  const coincide = await bcrypt.compare(password, usuario?.password_hash ?? HASH_SENUELO);

  if (!usuario || !coincide || !usuario.activo) {
    throw ApiError.noAutenticado('Email o contrasena incorrectos');
  }

  await pool.execute('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [usuario.id]);

  const refresco = await emitirRefresco(usuario.id, contexto);

  return {
    usuario: publico(usuario),
    acceso: firmarAcceso(usuario),
    refresco,
  };
}

/**
 * Margen de gracia para reutilizar un token recien rotado.
 *
 * Sin el, dos peticiones de refresco simultaneas se leen como robo: la
 * primera rota el token y la segunda, que salio con el mismo valor, llega ya
 * revocado y tumba la sesion. Pasa de verdad con dos pestanas del panel
 * abiertas a la vez, y en desarrollo con el doble montaje de StrictMode.
 *
 * Dentro del margen se entiende como carrera legitima: se emite un access
 * token nuevo pero NO se rota la cookie, porque el navegador ya tiene la que
 * dejo la otra peticion. Pasado el margen, se trata como robo.
 *
 * El precio es una ventana de replay de 10 s para un token robado. Es el
 * compromiso habitual; alargarla mucho si que empezaria a doler.
 */
const GRACIA_ROTACION_SEGUNDOS = 10;

/**
 * Rotacion con deteccion de reutilizacion: cada refresco emite un token nuevo
 * y revoca el anterior. Si llega un token revocado hace rato es senal de que
 * alguien se hizo con una copia, asi que se revocan todas las sesiones del
 * usuario.
 */
export async function refrescar(token, contexto = {}) {
  if (!token) throw ApiError.noAutenticado('No hay sesion que renovar');

  const hash = hashear(token);
  // La caducidad se evalua en SQL. Con dateStrings activado, expira_en llega
  // como '2026-08-12 11:09:18' sin zona, y new Date() lo interpretaria como
  // hora local cuando en realidad esta en UTC.
  const [filas] = await pool.execute(
    `SELECT rt.id, rt.usuario_id, rt.revocado_en,
            (rt.expira_en < NOW()) AS caducado,
            (rt.revocado_en IS NOT NULL
              AND rt.reemplazado_por IS NOT NULL
              AND rt.revocado_en > NOW() - INTERVAL ? SECOND) AS rotacion_reciente,
            u.nombre, u.email, u.rol, u.restaurante_id, u.activo
       FROM refresh_tokens rt
       JOIN usuarios u ON u.id = rt.usuario_id
      WHERE rt.token_hash = ?
      LIMIT 1`,
    [GRACIA_ROTACION_SEGUNDOS, hash]
  );

  const registro = filas[0];
  if (!registro) throw ApiError.noAutenticado('Sesion no valida');

  if (registro.revocado_en && !registro.rotacion_reciente) {
    await revocarTodas(registro.usuario_id);
    throw ApiError.noAutenticado(
      'Se ha detectado un uso indebido de la sesion. Vuelve a iniciar sesion.'
    );
  }

  if (registro.caducado) throw ApiError.noAutenticado('Sesion caducada');
  if (!registro.activo) throw ApiError.noAutenticado('Usuario desactivado');

  const usuario = {
    id: registro.usuario_id,
    nombre: registro.nombre,
    email: registro.email,
    rol: registro.rol,
    restaurante_id: registro.restaurante_id,
  };

  // Carrera legitima: se da el access token pero no se vuelve a rotar, que la
  // cookie buena ya la puso la peticion que gano.
  if (registro.rotacion_reciente) {
    return { usuario, acceso: firmarAcceso(usuario), refresco: null };
  }

  const nuevo = await emitirRefresco(registro.usuario_id, contexto);

  await pool.execute(
    'UPDATE refresh_tokens SET revocado_en = NOW(), reemplazado_por = ? WHERE id = ?',
    [hashear(nuevo.token), registro.id]
  );

  return { usuario, acceso: firmarAcceso(usuario), refresco: nuevo };
}

export async function revocar(token) {
  if (!token) return;
  await pool.execute(
    'UPDATE refresh_tokens SET revocado_en = NOW() WHERE token_hash = ? AND revocado_en IS NULL',
    [hashear(token)]
  );
}

export async function revocarTodas(usuarioId) {
  await pool.execute(
    'UPDATE refresh_tokens SET revocado_en = NOW() WHERE usuario_id = ? AND revocado_en IS NULL',
    [usuarioId]
  );
}

export async function obtenerUsuario(id) {
  const [filas] = await pool.execute(
    `SELECT id, nombre, email, rol, restaurante_id, activo, ultimo_acceso
       FROM usuarios WHERE id = ? LIMIT 1`,
    [id]
  );
  return filas[0] ?? null;
}

/** Limpia tokens caducados o revocados hace mas de 30 dias. */
export async function limpiarTokens() {
  const [res] = await pool.execute(
    `DELETE FROM refresh_tokens
      WHERE expira_en < NOW()
         OR (revocado_en IS NOT NULL AND revocado_en < NOW() - INTERVAL 30 DAY)`
  );
  return res.affectedRows;
}
