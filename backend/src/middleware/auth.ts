import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

export const verifyToken: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] });
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ error: 'Sesión expirada' });
    } else {
      res.status(401).json({ error: 'No autorizado' });
    }
  }
};
