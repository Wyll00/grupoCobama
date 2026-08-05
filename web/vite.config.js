import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Los puertos salen de web/.env para no chocar con otros proyectos que
 * corran a la vez en la maquina. Por defecto, 5180 y API en 4100: el 5173 de
 * Vite y el 4000 de Express los usa medio mundo.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const puerto = Number(env.WEB_PORT ?? 5180);
  const api = env.API_URL ?? 'http://localhost:4100';

  return {
    plugins: [react()],
    server: {
      port: puerto,
      // strictPort: si el puerto esta cogido, mejor fallar que arrancar en
      // otro sin avisar y dejar el CORS de la API apuntando al que no es.
      strictPort: true,
      // El front llama siempre a /api: en desarrollo lo proxea Vite, en
      // produccion lo resuelve el reverse proxy. Asi no hay URLs absolutas
      // repartidas por el codigo.
      proxy: {
        '/api': { target: api, changeOrigin: true },
        '/uploads': { target: api, changeOrigin: true },
      },
    },
  };
});
