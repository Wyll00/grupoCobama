import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { hashearPassword, revocarTodas } from './auth.service.js';

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.email, u.rol, u.restaurante_id, u.activo,
         u.ultimo_acceso, u.created_at,
         r.nombre AS restaurante_nombre, r.slug AS restaurante_slug
    FROM usuarios u
    LEFT JOIN restaurantes r ON r.id = u.restaurante_id
`;

const normalizar = (u) => ({ ...u, activo: Boolean(u.activo) });

export async function listar() {
  const [filas] = await pool.execute(`${SELECT_USUARIO} ORDER BY u.rol, u.nombre`);
  return filas.map(normalizar);
}

export async function obtener(id) {
  const [filas] = await pool.execute(`${SELECT_USUARIO} WHERE u.id = ? LIMIT 1`, [id]);
  if (!filas[0]) throw ApiError.noEncontrado('Ese usuario no existe');
  return normalizar(filas[0]);
}

export async function crear(datos) {
  await comprobarEmailLibre(datos.email);
  await comprobarLocalExiste(datos.restaurante_id);

  const [res] = await pool.execute(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, restaurante_id, activo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      datos.nombre,
      datos.email,
      await hashearPassword(datos.password),
      datos.rol,
      datos.restaurante_id ?? null,
      datos.activo === false ? 0 : 1,
    ]
  );

  return obtener(res.insertId);
}

export async function actualizar(id, datos, actor) {
  const actual = await obtener(id);

  // Un admin no puede quitarse a si mismo el rol ni desactivarse: si es el
  // ultimo admin del grupo, nadie podria volver a entrar al panel.
  if (actor.id === id) {
    if (datos.rol && datos.rol !== actual.rol) {
      throw ApiError.peticionInvalida('No puedes cambiar tu propio rol');
    }
    if (datos.activo === false) {
      throw ApiError.peticionInvalida('No puedes desactivar tu propio usuario');
    }
  }

  if (datos.email && datos.email !== actual.email) {
    await comprobarEmailLibre(datos.email);
  }

  // En un PATCH parcial el rol puede no venir: se valida contra el resultante.
  const rolFinal = datos.rol ?? actual.rol;
  const localFinal =
    datos.restaurante_id !== undefined ? datos.restaurante_id : actual.restaurante_id;

  if (rolFinal === 'admin_grupo' && localFinal != null) {
    throw ApiError.peticionInvalida('Un admin de grupo no se asigna a ningun local');
  }
  if (rolFinal === 'encargado_local' && localFinal == null) {
    throw ApiError.peticionInvalida('Un encargado necesita un local asignado');
  }
  await comprobarLocalExiste(localFinal);

  if (rolFinal === 'admin_grupo' && actual.rol === 'admin_grupo' && datos.activo === false) {
    await comprobarQuedaAlgunAdmin(id);
  }

  const columnas = [];
  const valores = [];

  const asignar = (columna, valor) => {
    columnas.push(`${columna} = ?`);
    valores.push(valor);
  };

  if (datos.nombre !== undefined) asignar('nombre', datos.nombre);
  if (datos.email !== undefined) asignar('email', datos.email);
  if (datos.rol !== undefined) asignar('rol', rolFinal);
  if (datos.rol !== undefined || datos.restaurante_id !== undefined) {
    asignar('restaurante_id', localFinal ?? null);
  }
  if (datos.activo !== undefined) asignar('activo', datos.activo ? 1 : 0);
  if (datos.password !== undefined) {
    asignar('password_hash', await hashearPassword(datos.password));
  }

  if (columnas.length > 0) {
    await pool.execute(`UPDATE usuarios SET ${columnas.join(', ')} WHERE id = ?`, [
      ...valores,
      id,
    ]);
  }

  // Cambiar contrasena, rol, local o desactivar tiene que echar al usuario de
  // las sesiones abiertas: el access token lleva el rol y el local firmados
  // dentro y seguiria valiendo hasta caducar.
  const requiereCerrarSesion =
    datos.password !== undefined ||
    datos.activo === false ||
    (datos.rol !== undefined && datos.rol !== actual.rol) ||
    (datos.restaurante_id !== undefined && datos.restaurante_id !== actual.restaurante_id);

  if (requiereCerrarSesion) await revocarTodas(id);

  return obtener(id);
}

export async function desactivar(id, actor) {
  if (actor.id === id) {
    throw ApiError.peticionInvalida('No puedes desactivar tu propio usuario');
  }

  const usuario = await obtener(id);
  if (usuario.rol === 'admin_grupo') await comprobarQuedaAlgunAdmin(id);

  await pool.execute('UPDATE usuarios SET activo = 0 WHERE id = ?', [id]);
  await revocarTodas(id);
  return obtener(id);
}

export async function cambiarPasswordPropia(id, { passwordActual, passwordNueva }) {
  const [filas] = await pool.execute(
    'SELECT password_hash FROM usuarios WHERE id = ? LIMIT 1',
    [id]
  );
  if (!filas[0]) throw ApiError.noEncontrado('Ese usuario no existe');

  if (!(await bcrypt.compare(passwordActual, filas[0].password_hash))) {
    throw ApiError.peticionInvalida('La contrasena actual no es correcta');
  }

  await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [
    await hashearPassword(passwordNueva),
    id,
  ]);

  // Se cierran las demas sesiones; la actual se renueva desde el cliente.
  await revocarTodas(id);
}

async function comprobarEmailLibre(email) {
  const [filas] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (filas.length > 0) throw ApiError.conflicto('Ya hay un usuario con ese email');
}

async function comprobarLocalExiste(restauranteId) {
  if (restauranteId == null) return;
  const [filas] = await pool.execute('SELECT id FROM restaurantes WHERE id = ?', [
    restauranteId,
  ]);
  if (filas.length === 0) throw ApiError.peticionInvalida('Ese local no existe');
}

async function comprobarQuedaAlgunAdmin(excluyendoId) {
  const [[{ otros }]] = await pool.execute(
    `SELECT COUNT(*) AS otros FROM usuarios
      WHERE rol = 'admin_grupo' AND activo = 1 AND id <> ?`,
    [excluyendoId]
  );
  if (otros === 0) {
    throw ApiError.peticionInvalida(
      'Es el ultimo admin de grupo activo: si lo desactivas nadie podra entrar al panel'
    );
  }
}
