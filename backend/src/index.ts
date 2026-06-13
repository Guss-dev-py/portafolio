import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import projectsRouter from './routes/projects';
import contactRouter from './routes/contact';
import messagesRouter from './routes/messages';
import statusRouter from './routes/status';
import uploadsRouter from './routes/uploads';
import logsRouter from './routes/logs';
import statsRouter from './routes/stats';
import { loginLimiter, contactLimiter } from './middleware/rateLimiter';
import { securityHeaders, mutationLimiter } from './middleware/security';
import { runMigrations } from './utils/runMigrations';

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD_HASH',
  'PORT',
  'CORS_ORIGIN',
  'RESEND_API_KEY',
  'RECIPIENT_EMAIL',
];

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Error: Las siguientes variables de entorno son obligatorias y no están definidas: ${missing.join(', ')}`
  );
  process.exit(1);
}

const app = express();

// Detrás de nginx: sin esto express-rate-limit ve la IP del proxy para todos
// los clientes y los límites se vuelven globales en vez de por visitante.
app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  // El frontend necesita leer el token renovado por la sesión deslizante
  exposedHeaders: ['X-Refreshed-Token'],
}));
app.use(express.json());
app.use('/api', mutationLimiter);

app.use('/api/health', healthRouter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/contact', contactLimiter, contactRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/status', statusRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/stats', statsRouter);

// Global error handler — must have 4 params to be recognized by Express
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;

const PORT = process.env.PORT ?? 3000;

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
