import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  timezone: 'Z',
  // DECIMAL(6,2) cabe de sobra en un double: se puede devolver como numero
  // sin perder precision y el frontend se ahorra el parseo.
  decimalNumbers: true,
  // DATE y TIME como string: '2026-08-04', '12:30:00'. Sin sorpresas de zona.
  dateStrings: true,
});

export async function comprobarConexion() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

/** Ejecuta un callback dentro de una transaccion. */
export async function transaccion(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
