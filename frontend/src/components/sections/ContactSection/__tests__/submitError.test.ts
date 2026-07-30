import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { describeSubmitError } from '../submitError';
import { ApiError } from '../../../../api/client';

describe('describeSubmitError', () => {
  it('explica el rate limit y ofrece el email como salida', () => {
    const msg = describeSubmitError(new ApiError(429, 'Demasiadas solicitudes'));
    expect(msg).toMatch(/límite de envíos/i);
    expect(msg).toMatch(/5 cada 15 minutos/);
    expect(msg).toMatch(/email/i);
  });

  it('en un 400 reutiliza el mensaje del backend', () => {
    const msg = describeSubmitError(new ApiError(400, 'El mensaje es muy corto.'));
    expect(msg).toContain('El mensaje es muy corto.');
    expect(msg).toMatch(/revisá los datos/i);
  });

  it('ante un fallo del servidor aclara que el texto no se perdió', () => {
    const msg = describeSubmitError(new ApiError(500, 'Error interno del servidor'));
    expect(msg).toMatch(/sigue acá|no se perdió/i);
    expect(msg).toMatch(/email/i);
  });

  it('distingue la falta de red de un error de la API', () => {
    const msg = describeSubmitError(new TypeError('Failed to fetch'));
    expect(msg).toMatch(/conexión/i);
    expect(msg).toMatch(/no se perdió/i);
  });

  it('nunca devuelve una cadena vacía, sea cual sea el error', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 400, max: 599 }).map(s => new ApiError(s, 'boom')),
          fc.string().map(m => new Error(m)),
          fc.anything(),
        ),
        err => {
          const msg = describeSubmitError(err);
          expect(typeof msg).toBe('string');
          expect(msg.trim().length).toBeGreaterThan(0);
        },
      ),
    );
  });
});
