import 'dotenv/config';

function req(nombre, porDefecto) {
  const valor = process.env[nombre] ?? porDefecto;
  if (valor === undefined) {
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }
  return valor;
}

export const env = {
  port: Number(req('PORT', 4000)),
  nodeEnv: req('NODE_ENV', 'development'),
  isProd: process.env.NODE_ENV === 'production',

  db: {
    host: req('DB_HOST', '127.0.0.1'),
    port: Number(req('DB_PORT', 3306)),
    user: req('DB_USER', 'cobama'),
    password: req('DB_PASSWORD', 'cobama'),
    database: req('DB_NAME', 'cobama'),
  },

  corsOrigin: req('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  webBaseUrl: req('WEB_BASE_URL', 'http://localhost:5173'),
};
