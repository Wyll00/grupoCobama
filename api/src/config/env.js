import 'dotenv/config';
import { randomBytes } from 'node:crypto';

function req(nombre, porDefecto) {
  const valor = process.env[nombre] ?? porDefecto;
  if (valor === undefined) {
    throw new Error(`Falta la variable de entorno ${nombre}`);
  }
  return valor;
}

const enProduccion = process.env.NODE_ENV === 'production';

/**
 * En produccion el secreto es obligatorio. En desarrollo se genera uno al
 * vuelo: cada reinicio invalida las sesiones abiertas, que es molesto pero
 * mucho mejor que dejar un secreto por defecto escrito en el repositorio y
 * que alguien lo herede sin darse cuenta al desplegar.
 */
function secreto(nombre) {
  const valor = process.env[nombre];
  if (valor) return valor;
  if (enProduccion) {
    throw new Error(`Falta ${nombre}. En produccion es obligatorio.`);
  }
  console.warn(
    `[aviso] ${nombre} no definido: se genera uno temporal. ` +
      'Las sesiones se invalidan en cada reinicio de la API.'
  );
  return randomBytes(32).toString('hex');
}

export const env = {
  port: Number(req('PORT', 4100)),
  nodeEnv: req('NODE_ENV', 'development'),
  isProd: enProduccion,

  db: {
    host: req('DB_HOST', '127.0.0.1'),
    port: Number(req('DB_PORT', 3306)),
    user: req('DB_USER', 'cobama'),
    password: req('DB_PASSWORD', 'cobama'),
    database: req('DB_NAME', 'cobama'),
  },

  corsOrigin: req('CORS_ORIGIN', 'http://localhost:5180')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  webBaseUrl: req('WEB_BASE_URL', 'http://localhost:5180'),

  jwt: {
    secreto: secreto('JWT_SECRET'),
    // Access token corto: vive solo en memoria del navegador y se renueva con
    // la cookie de refresco.
    duracionAcceso: req('JWT_ACCESS_TTL', '15m'),
    duracionRefrescoDias: Number(req('JWT_REFRESH_TTL_DIAS', 7)),
  },

  cookie: {
    nombre: 'cobama_refresh',
    // sameSite lax basta: el refresco es una peticion de primera parte desde
    // la propia web. En produccion, ademas, solo por HTTPS.
    opciones: {
      httpOnly: true,
      sameSite: 'lax',
      secure: enProduccion,
      path: '/api/auth',
    },
  },

  uploads: {
    directorio: req('UPLOADS_DIR', 'uploads'),
    tamanoMaximoMb: Number(req('UPLOAD_MAX_MB', 8)),
  },

  correo: {
    // Sin SMTP los avisos se escriben en api/correos/ en lugar de perderse.
    activo: Boolean(process.env.SMTP_HOST),
    remitente: req('CORREO_REMITENTE', 'reservas@grupocobama.es'),
  },
};
