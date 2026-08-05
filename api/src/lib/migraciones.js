/**
 * Runner de migraciones y seeds.
 *
 * Sustituye a docker-entrypoint-initdb.d, que solo se ejecuta cuando el
 * volumen de MySQL esta vacio: con el, cualquier cambio de esquema obligaba a
 * borrar la base de datos entera.
 *
 * Cada fichero .sql se aplica una vez y queda registrado en `migraciones` por
 * nombre. El fichero completo va en una sola llamada (multipleStatements), asi
 * que no se pueden usar sentencias con DELIMITER.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const TABLA = `
  CREATE TABLE IF NOT EXISTS migraciones (
    id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre    VARCHAR(255) NOT NULL,
    lote      VARCHAR(20)  NOT NULL,
    aplicada  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_migraciones_nombre (nombre)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

async function conectar() {
  return mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
  });
}

/**
 * Aplica los .sql de `directorio` que aun no consten en `migraciones`.
 * `lote` distingue migraciones de seeds en el registro.
 */
export async function aplicar(directorio, lote) {
  const conn = await conectar();
  try {
    await conn.query(TABLA);

    const [aplicadas] = await conn.query(
      'SELECT nombre FROM migraciones WHERE lote = ?',
      [lote]
    );
    const yaEstan = new Set(aplicadas.map((f) => f.nombre));

    const ficheros = (await readdir(directorio))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pendientes = ficheros.filter((f) => !yaEstan.has(f));

    if (pendientes.length === 0) {
      console.log(`${lote}: nada pendiente (${ficheros.length} ya aplicados).`);
      return 0;
    }

    for (const fichero of pendientes) {
      const sql = await readFile(join(directorio, fichero), 'utf8');
      process.stdout.write(`${lote}: aplicando ${fichero} ... `);
      try {
        await conn.query(sql);
        await conn.query('INSERT INTO migraciones (nombre, lote) VALUES (?, ?)', [
          fichero,
          lote,
        ]);
        console.log('ok');
      } catch (err) {
        console.log('ERROR');
        throw new Error(`${fichero}: ${err.message}`, { cause: err });
      }
    }

    return pendientes.length;
  } finally {
    await conn.end();
  }
}

/**
 * Marca ficheros como aplicados SIN ejecutarlos. Sirve para adoptar una base
 * de datos que ya venia cargada por docker-entrypoint-initdb.d.
 *
 * `hasta` es obligatorio y acota hasta que fichero se da por aplicado. Sin
 * ese limite es facil marcar como aplicada una migracion que nunca se ha
 * ejecutado y dejar el esquema a medias sin que nada avise.
 */
export async function marcarComoAplicadas(directorio, lote, hasta) {
  if (!hasta) {
    throw new Error(
      `Falta indicar hasta que fichero adoptar en "${lote}". ` +
        'Ejemplo: npm run db:adoptar --prefix api -- 001_schema.sql'
    );
  }

  const conn = await conectar();
  try {
    await conn.query(TABLA);

    const todos = (await readdir(directorio)).filter((f) => f.endsWith('.sql')).sort();
    if (!todos.includes(hasta)) {
      throw new Error(`"${hasta}" no existe en ${directorio}`);
    }

    const adoptados = todos.filter((f) => f <= hasta);
    for (const fichero of adoptados) {
      await conn.query('INSERT IGNORE INTO migraciones (nombre, lote) VALUES (?, ?)', [
        fichero,
        lote,
      ]);
    }

    const pendientes = todos.length - adoptados.length;
    console.log(
      `${lote}: ${adoptados.length} marcados como aplicados` +
        (pendientes > 0 ? `, ${pendientes} quedan pendientes de ejecutar.` : '.')
    );
  } finally {
    await conn.end();
  }
}

export async function estado() {
  const conn = await conectar();
  try {
    await conn.query(TABLA);
    const [filas] = await conn.query(
      'SELECT nombre, lote, aplicada FROM migraciones ORDER BY lote, nombre'
    );
    return filas;
  } finally {
    await conn.end();
  }
}
