/**
 * GET /api/logs: actividad reciente del admin (JWT, real). Limit con clamp.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../../db', () => ({ default: { query: vi.fn() } }));

import pool from '../../db';
import logsRouter from '../logs';

const mockedQuery = pool.query as ReturnType<typeof vi.fn>;

const app = express();
app.use('/api/logs', logsRouter);

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});
beforeEach(() => vi.clearAllMocks());

const token = () => jwt.sign({ sub: 'admin' }, 'test-secret', { expiresIn: '8h' });

const logRow = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  action: 'project_created',
  entity: 'project',
  entity_id: 'abc',
  detail: 'Mi App',
  created_at: new Date('2026-06-12T10:00:00Z'),
};

describe('GET /api/logs', () => {
  it('sin token → 401', async () => {
    const res = await request(app).get('/api/logs');
    expect(res.status).toBe(401);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('devuelve la actividad mapeada a camelCase', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [logRow] });

    const res = await request(app).get('/api/logs').set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body[0]).toEqual({
      id: logRow.id,
      action: 'project_created',
      entity: 'project',
      entityId: 'abc',
      detail: 'Mi App',
      createdAt: '2026-06-12T10:00:00.000Z',
    });
  });

  it('limit se clampa a [1, 500]', async () => {
    mockedQuery.mockResolvedValue({ rows: [] });

    await request(app).get('/api/logs?limit=9999').set('Authorization', `Bearer ${token()}`);
    expect(mockedQuery.mock.calls[0][1]).toEqual([500]);

    await request(app).get('/api/logs?limit=-5').set('Authorization', `Bearer ${token()}`);
    expect(mockedQuery.mock.calls[1][1]).toEqual([1]);

    await request(app).get('/api/logs').set('Authorization', `Bearer ${token()}`);
    expect(mockedQuery.mock.calls[2][1]).toEqual([100]);
  });
});
