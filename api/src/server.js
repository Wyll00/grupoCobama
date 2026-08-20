import { app } from './app.js';
import { env } from './config/env.js';
import { pool, comprobarConexion } from './config/db.js';
import { procesarPendientes } from './services/sincronizacion.service.js';

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

/**
 * Reintentador de envios a CoverManager.
 *
 * Red de seguridad, no el camino normal: lo habitual es que la reserva se
 * mande en el momento de crearla. Esto recoge lo que fallo porque su API
 * estaba caida o el proceso murio a medias.
 *
 * unref() para que este temporizador no impida que el proceso termine: sin
 * el, Node se queda vivo esperando el siguiente tic y el servidor nunca
 * acaba de cerrar.
 */
let reintentador = null;
if (env.coverManager.activo) {
  reintentador = setInterval(async () => {
    try {
      const r = await procesarPendientes();
      if (r.enviadas || r.fallidas || r.desatascadas) {
        console.log(
          `[covermanager] enviadas ${r.enviadas}, fallidas ${r.fallidas}` +
            (r.desatascadas ? `, desatascadas ${r.desatascadas}` : '')
        );
      }
    } catch (e) {
      console.error('[covermanager] fallo el reintentador:', e.message);
    }
  }, env.coverManager.intervaloSegundos * 1000);
  reintentador.unref();
  console.log(`CoverManager activo, reintentando cada ${env.coverManager.intervaloSegundos}s`);
}

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    console.log(`\n${senal} recibida, cerrando...`);
    if (reintentador) clearInterval(reintentador);
    servidor.close(async () => {
      await pool.end();
      process.exit(0);
    });
  });
}
