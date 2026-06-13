/**
 * PUT /api/projects/reorder: actualiza `position` según el orden recibido.
 * Protegido por JWT (middleware real), valida el body con Zod.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock the pg pool — do NOT mock auth middleware (we test real auth behavior)
vi.mock('../../db', () => ({
  default: {
    query: vi.fn(),
  },
}));

import pool from '../../db';
import projectsRouter from '../projects';

const UUID_A = '550e8400-e29b-41d4-a716-446655440000';
const UUID_B = '550e8400-e29b-41d4-a716-446655440001';
const UUID_C = '550e8400-e29b-41d4-a716-446655440002';

const testApp = express();
testApp.use(express.json());
testApp.use('/api/projects', projectsRouter);

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

beforeEach(() => {
  vi.clearAllMocks();
});

function makeValidToken(): string {
  return jwt.sign({ sub: 'admin' }, 'test-secret', { expiresIn: '8h' });
}

describe('PUT /api/projects/reorder', () => {
  it('sin token → 401, DB no tocada', async () => {
    const res = await request(testApp)
      .put('/api/projects/reorder')
      .send({ ids: [UUID_A, UUID_B] });

    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('body sin ids → 400', async () => {
    const res = await request(testApp)
      .put('/api/projects/reorder')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .send({});

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('ids vacío → 400', async () => {
    const res = await request(testApp)
      .put('/api/projects/reorder')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .send({ ids: [] });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('ids con valores que no son UUID → 400', async () => {
    const res = await request(testApp)
      .put('/api/projects/reorder')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .send({ ids: ['not-a-uuid', UUID_A] });

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('ids válidos → 204 y un único UPDATE con el array en orden', async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rowCount: 3 });

    const ids = [UUID_C, UUID_A, UUID_B];
    const res = await request(testApp)
      .put('/api/projects/reorder')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .send({ ids });

    expect(res.status).toBe(204);
    expect(pool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(sql).toMatch(/UPDATE projects/i);
    expect(sql).toMatch(/position/i);
    expect(params).toEqual([ids]);
  });

  it('error de DB → 500', async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('db down'));

    const res = await request(testApp)
      .put('/api/projects/reorder')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .send({ ids: [UUID_A] });

    expect(res.status).toBe(500);
  });
});

describe('GET /api/projects ordena por position', () => {
  it('la consulta ordena por position antes que por created_at', async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });

    const res = await request(testApp).get('/api/projects');

    expect(res.status).toBe(200);
    const [sql] = (pool.query as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(sql).toMatch(/ORDER BY\s+position/i);
  });
});
