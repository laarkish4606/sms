import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';

import env from './config/env.js';
import apiRoutes from './routes/index.js';
import { sanitizeRequest } from './middleware/sanitize.middleware.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(sanitizeRequest);

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

app.use('/uploads', express.static(path.resolve('uploads')));

app.use('/api/v1', globalLimiter, apiRoutes);

app.get('/api/v1/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
