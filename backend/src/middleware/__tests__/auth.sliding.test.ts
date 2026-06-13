/**
 * Sesión deslizante: si al token le queda menos de la mitad de vida (4h de 8h),
 * verifyToken emite uno fresco en el header X-Refreshed-Token. Así el admin
 * activo nunca es expulsado en medio de una edición.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../auth';

const app = express();
app.get('/protected', verifyToken, (_req, res) => { res.json({ ok: true }); });

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

function tokenExpiringIn(seconds: number): string {
  return jwt.sign({ sub: 'admin', username: 'augusto' }, 'test-secret', { expiresIn: seconds });
}

describe('sesión deslizante (X-Refreshed-Token)', () => {
  it('token con poca vida restante → emite token fresco válido con el mismo sub', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${tokenExpiringIn(60 * 60)}`); // 1h restante

    expect(res.status).toBe(200);
    const refreshed = res.headers['x-refreshed-token'];
    expect(refreshed).toBeTruthy();

    const payload = jwt.verify(refreshed, 'test-secret') as jwt.JwtPayload;
    expect(payload.sub).toBe('admin');
    expect(payload.username).toBe('augusto');
    // ~8h de vida nueva
    expect(payload.exp! - Math.floor(Date.now() / 1000)).toBeGreaterThan(7.5 * 3600);
  });

  it('token fresco → no emite header', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${tokenExpiringIn(7 * 60 * 60)}`); // 7h restante

    expect(res.status).toBe(200);
    expect(res.headers['x-refreshed-token']).toBeUndefined();
  });

  it('token expirado sigue siendo 401 (no se renueva lo vencido)', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${tokenExpiringIn(-10)}`);

    expect(res.status).toBe(401);
    expect(res.headers['x-refreshed-token']).toBeUndefined();
  });
});
