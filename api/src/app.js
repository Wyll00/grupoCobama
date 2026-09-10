import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';

import { env } from './config/env.js';
import { router } from './routes/index.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { reservasRouter } from './routes/reservas.routes.js';
import { noEncontrado, manejadorErrores } from './middleware/errores.js';
import { prerender, DIST } from './middleware/prerender.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { getRobots, getSitemap } from './controllers/seo.controller.js';

export const app = express();

app.disable('x-powered-by');

// Detras de un reverse proxy, para que req.ip y el rate limit vean la IP real.
if (env.isProd) app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// credentials: la cookie de refresco viaja entre origenes en desarrollo
// (5180 -> 4100), asi que CORS tiene que permitirlo explicitamente.
app.use(cors({ origin: env.corsOrigin, credentials: true }));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Imagenes de platos en desarrollo. En produccion se sirven desde R2/S3.
app.use('/uploads', express.static(env.uploads.directorio, { maxAge: '7d' }));

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reservas', reservasRouter);
app.use('/api', router);

// --- Web publica servida desde la API ---------------------------------------
// Sirve para probar en local exactamente lo que veria un buscador, y como
// alternativa de despliegue si la web acaba en el mismo VPS que la API. En
// desarrollo del dia a dia el front lo sirve Vite en su puerto.

app.get('/robots.txt', asyncHandler(getRobots));
app.get('/sitemap.xml', asyncHandler(getSitemap));

/*
  DOS CACHES, y la diferencia importa.

  Vite pone en /assets/ los ficheros con el contenido metido en el nombre
  -index-DvAHrce7.js-, asi que cambiar el codigo cambia la URL. Esos se pueden
  cachear un ano y marcarlos `immutable`: nunca van a cambiar bajo esa URL.

  Lo que sale de web/public/ -los iconos de alergenos, las fotos de la
  portada- se copia a dist TAL CUAL, con la URL fija. Con un ano de cache,
  cambiar el icono de la mostaza no lo veria nadie que ya hubiera entrado a la
  web: seguiria sirviendo el viejo desde su navegador durante un ano. Paso de
  verdad al cambiarlo.

  Esos van con `no-cache`, que no significa "no lo guardes" sino "guardalo
  pero preguntame antes de usarlo". La respuesta habitual es un 304 sin
  cuerpo, o sea que no se descargan otra vez: se paga una peticion y se gana
  poder cambiar una imagen y que se vea.

  index: false para que sea el prerenderizado quien sirva el HTML, no el
  middleware de estaticos.
*/
app.use(
  '/assets',
  express.static(join(DIST, 'assets'), { index: false, immutable: true, maxAge: '1y' })
);
app.use(express.static(DIST, { index: false, maxAge: 0, etag: true }));
app.use(prerender());

app.use(noEncontrado);
app.use(manejadorErrores);
