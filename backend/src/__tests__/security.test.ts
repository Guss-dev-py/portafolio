/**
 * Hardening HTTP: helmet (headers de seguridad) + rate limit en mutaciones.
 */

import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { securityHeaders, mutationLimiter } from '../middleware/security';

function makeApp() {
  const app = express();
  app.use(securityHeaders);
  app.use(mutationLimiter);
  app.get('/api/thing', (_req, res) => { res.json({ ok: true }); });
  app.post('/api/thing', (_req, res) => { res.json({ ok: true }); });
  return app;
}

describe('headers de seguridad (helmet)', () => {
  it('setea nosniff, frame deny y oculta x-powered-by', async () => {
    const res = await request(makeApp()).get('/api/thing');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('CORP permite cross-origin (las imágenes de /api/uploads se ven desde el frontend dev)', async () => {
    const res = await request(makeApp()).get('/api/thing');
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });
});

describe('rate limit de mutaciones', () => {
  it('los POST llevan headers de rate limit; los GET no se limitan', async () => {
    const app = makeApp();

    const post = await request(app).post('/api/thing');
    expect(post.headers['ratelimit-limit'] ?? post.headers['ratelimit']).toBeDefined();

    const get = await request(app).get('/api/thing');
    expect(get.headers['ratelimit-limit'] ?? get.headers['ratelimit']).toBeUndefined();
  });
});
