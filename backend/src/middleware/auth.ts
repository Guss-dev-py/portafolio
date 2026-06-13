import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

const TOKEN_TTL = '8h';
// Sesión deslizante: renovar cuando queda menos de la mitad de vida (4h)
const REFRESH_THRESHOLD_S = 4 * 60 * 60;

export const verifyToken: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] });

    // Sesión deslizante: si el token está por vencer, emitir uno fresco en un
    // header de respuesta. El frontend lo persiste y el admin activo nunca es
    // expulsado en medio de una edición. Lo vencido sigue siendo 401.
    if (typeof payload === 'object' && payload.exp) {
      const remaining = payload.exp - Math.floor(Date.now() / 1000);
      if (remaining < REFRESH_THRESHOLD_S) {
        const { sub, username } = payload as jwt.JwtPayload & { username?: string };
        const fresh = jwt.sign({ sub, username }, process.env.JWT_SECRET!, {
          expiresIn: TOKEN_TTL,
          algorithm: 'HS256',
        });
        res.setHeader('X-Refreshed-Token', fresh);
      }
    }

    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ error: 'Sesión expirada' });
    } else {
      res.status(401).json({ error: 'No autorizado' });
    }
  }
};
