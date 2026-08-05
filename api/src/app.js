import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { router } from './routes/index.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { noEncontrado, manejadorErrores } from './middleware/errores.js';

export const app = express();

app.disable('x-powered-by');

// Detras de un reverse proxy, para que req.ip y el rate limit vean la IP real.
if (env.isProd) app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// credentials: la cookie de refresco viaja entre origenes en desarrollo
// (5173 -> 4000), asi que CORS tiene que permitirlo explicitamente.
app.use(cors({ origin: env.corsOrigin, credentials: true }));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Imagenes de platos en desarrollo. En produccion se sirven desde R2/S3.
app.use('/uploads', express.static(env.uploads.directorio, { maxAge: '7d' }));

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', router);

app.use(noEncontrado);
app.use(manejadorErrores);
