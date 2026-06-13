/**
 * POST /api/uploads: sube una imagen (JWT requerido) y la sirve estáticamente.
 * Valida tipo de archivo y devuelve la URL pública relativa.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { type Router } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import os from 'os';
import path from 'path';

// PNG mínimo válido (1x1 transparente)
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

let testApp: express.Express;
let uploadsDir: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-test-'));
  process.env.UPLOADS_DIR = uploadsDir;

  // Import dinámico: el router lee UPLOADS_DIR al inicializarse
  const { default: uploadsRouter } = (await import('../uploads')) as { default: Router };
  testApp = express();
  testApp.use('/api/uploads', uploadsRouter);
});

afterAll(() => {
  fs.rmSync(uploadsDir, { recursive: true, force: true });
});

function makeValidToken(): string {
  return jwt.sign({ sub: 'admin' }, 'test-secret', { expiresIn: '8h' });
}

describe('POST /api/uploads', () => {
  it('sin token → 401', async () => {
    const res = await request(testApp)
      .post('/api/uploads')
      .attach('image', PNG_BYTES, 'foto.png');

    expect(res.status).toBe(401);
  });

  it('sin archivo → 400', async () => {
    const res = await request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`);

    expect(res.status).toBe(400);
  });

  it('tipo de archivo no permitido → 400', async () => {
    const res = await request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .attach('image', Buffer.from('no soy una imagen'), {
        filename: 'script.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
  });

  it('PNG válido → 201 con url relativa y archivo en disco', async () => {
    const res = await request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .attach('image', PNG_BYTES, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/api\/uploads\/[\w.-]+\.png$/);

    const filename = res.body.url.split('/').pop()!;
    expect(fs.existsSync(path.join(uploadsDir, filename))).toBe(true);
  });

  it('la imagen subida se sirve por GET', async () => {
    const upload = await request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .attach('image', PNG_BYTES, { filename: 'foto.png', contentType: 'image/png' });

    const res = await request(testApp).get(upload.body.url as string);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
  });
});
