/**
 * POST /api/uploads: sube una imagen (JWT requerido) y la sirve estáticamente.
 * Valida tipo de archivo y devuelve la URL pública relativa.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../utils/audit', () => ({ audit: vi.fn() }));
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

  it('PNG válido → 201, se optimiza a .webp y queda en disco', async () => {
    const res = await request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .attach('image', PNG_BYTES, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    // sharp normaliza todo a webp para ahorrar peso
    expect(res.body.url).toMatch(/^\/api\/uploads\/[\w.-]+\.webp$/);

    const filename = res.body.url.split('/').pop()!;
    const stored = path.join(uploadsDir, filename);
    expect(fs.existsSync(stored)).toBe(true);

    // El archivo en disco es realmente webp (magic bytes RIFF....WEBP)
    const buf = fs.readFileSync(stored);
    expect(buf.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(buf.subarray(8, 12).toString('ascii')).toBe('WEBP');
  });

  it('el nombre del archivo sale del nombre del proyecto', async () => {
    // El nombre de archivo es factor de ranking en búsqueda de imágenes. Antes
    // era `<timestamp>-<random>.webp`, que no decía nada.
    const res = await request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .field('name', 'Gastos Familiares')
      .attach('image', PNG_BYTES, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/api\/uploads\/gastos-familiares-[0-9a-f]{12}\.webp$/);
  });

  it('sin nombre de proyecto usa el fallback, no rompe', async () => {
    const res = await request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .attach('image', PNG_BYTES, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/api\/uploads\/imagen-[0-9a-f]{12}\.webp$/);
  });

  it('un nombre con path traversal no escribe fuera de la carpeta de uploads', async () => {
    const res = await request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .field('name', '../../etc/passwd')
      .attach('image', PNG_BYTES, { filename: 'foto.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/api\/uploads\/etc-passwd-[0-9a-f]{12}\.webp$/);

    // Y lo que importa: el archivo está adentro de uploadsDir y en ningún lado más.
    const filename = res.body.url.split('/').pop()!;
    expect(filename).not.toContain('..');
    expect(fs.existsSync(path.join(uploadsDir, filename))).toBe(true);
    expect(path.dirname(path.resolve(path.join(uploadsDir, filename))))
      .toBe(path.resolve(uploadsDir));
  });

  it('dos subidas del mismo proyecto no se pisan', async () => {
    const subir = () => request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .field('name', 'Portafolio')
      .attach('image', PNG_BYTES, { filename: 'foto.png', contentType: 'image/png' });

    const a = await subir();
    const b = await subir();

    expect(a.body.url).not.toBe(b.body.url);
    expect(fs.existsSync(path.join(uploadsDir, a.body.url.split('/').pop()!))).toBe(true);
    expect(fs.existsSync(path.join(uploadsDir, b.body.url.split('/').pop()!))).toBe(true);
  });

  it('la imagen optimizada se sirve por GET como webp', async () => {
    const upload = await request(testApp)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .attach('image', PNG_BYTES, { filename: 'foto.png', contentType: 'image/png' });

    const res = await request(testApp).get(upload.body.url as string);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/webp');
  });
});
