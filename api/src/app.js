import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { env } from './config/env.js';
import { router } from './routes/index.js';
import { noEncontrado, manejadorErrores } from './middleware/errores.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.isProd ? 'combined' : 'dev'));

// Imagenes de platos en desarrollo. En produccion se sirven desde R2/S3.
app.use('/uploads', express.static('uploads', { maxAge: '7d' }));

app.use('/api', router);

app.use(noEncontrado);
app.use(manejadorErrores);
