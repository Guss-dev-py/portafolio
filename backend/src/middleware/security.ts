import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Headers de seguridad para una API JSON detrás de nginx.
 * CORP en cross-origin: las imágenes de /api/uploads se consumen desde el
 * frontend de dev (localhost:5173) que es otro origin que el backend (3001).
 */
export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * Límite generoso para mutaciones autenticadas (defensa en profundidad);
 * los GET/HEAD/OPTIONS no se limitan. Login y contact tienen limiters propios
 * más estrictos que se aplican además de éste.
 */
export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
  message: { error: 'Demasiadas operaciones. Esperá unos minutos.' },
});
