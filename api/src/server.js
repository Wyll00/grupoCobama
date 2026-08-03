import { app } from './app.js';
import { env } from './config/env.js';
import { pool, comprobarConexion } from './config/db.js';

const servidor = app.listen(env.port, async () => {
  console.log(`API Cobama escuchando en http://localhost:${env.port}/api`);
  try {
    await comprobarConexion();
    console.log(`Conectado a MySQL ${env.db.host}:${env.db.port}/${env.db.database}`);
  } catch (err) {
    console.error('No hay conexion con MySQL. Levanta la base de datos con:');
    console.error('  docker compose up -d');
    console.error(err.message);
  }
});

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    console.log(`\n${senal} recibida, cerrando...`);
    servidor.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
}
