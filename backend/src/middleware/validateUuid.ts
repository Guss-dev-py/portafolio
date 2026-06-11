import { Request, Response, NextFunction, RequestHandler } from 'express';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valida que el parámetro de ruta sea un UUID. Sin esto, un id malformado
 * llega a Postgres, que lanza `invalid input syntax for type uuid` y la
 * request termina en 500 en vez de 404.
 */
export function validateUuidParam(param = 'id'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!UUID_RE.test(req.params[param] ?? '')) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }
    next();
  };
}
