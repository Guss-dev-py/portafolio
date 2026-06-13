/**
 * Paginación opcional de GET /api/messages: sin params responde el array de
 * siempre (retrocompatible); con ?page responde envelope {items,total,page,limit}.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../utils/audit', () => ({ audit: vi.fn() }));
vi.mock('../../db', () => ({ default: { query: vi.fn() } }));
vi.mock('../../middleware/auth', () => ({
  verifyToken: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

import pool from '../../db';
import messagesRouter from '../messages';

const mockedQuery = pool.query as ReturnType<typeof vi.fn>;

const app = express();
app.use('/api/messages', messagesRouter);

const row = (i: number) => ({
  id: `550e8400-e29b-41d4-a716-44665544000${i}`,
  name: `P${i}`,
  email: `p${i}@example.com`,
  message: 'Un mensaje con largo suficiente.',
  status: 'read',
  created_at: new Date(),
  deleted_at: null,
});

beforeEach(() => vi.clearAllMocks());

describe('GET /api/messages paginado', () => {
  it('sin params → array plano (retrocompatible)', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [row(1), row(2)] });

    const res = await request(app).get('/api/messages');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const [sql] = mockedQuery.mock.calls[0];
    expect(sql).not.toMatch(/LIMIT/i);
  });

  it('con ?page=2&limit=10 → envelope con total y OFFSET correcto', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ total: '25' }] })
      .mockResolvedValueOnce({ rows: [row(1)] });

    const res = await request(app).get('/api/messages?page=2&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(25);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(10);
    expect(Array.isArray(res.body.items)).toBe(true);

    const [listSql, listParams] = mockedQuery.mock.calls[1];
    expect(listSql).toMatch(/LIMIT \$1 OFFSET \$2/i);
    expect(listParams).toEqual([10, 10]);
  });

  it('limit se clampa a [1, 100] y page a >= 1', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/messages?page=0&limit=9999');

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(100);
  });
});
