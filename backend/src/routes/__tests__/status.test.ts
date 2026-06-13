import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../utils/audit', () => ({ audit: vi.fn() }));
vi.mock('../../db', () => ({ default: { query: vi.fn() } }));
vi.mock('../../middleware/auth', () => ({
  verifyToken: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

import pool from '../../db';
import statusRouter from '../status';

const app = express();
app.use(express.json());
app.use('/api/status', statusRouter);

describe('GET /api/status', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the current work_status from DB', async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [{ value: 'working' }] });
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'working' });
  });

  it('falls back to "open" when no row exists', async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'open' });
  });
});

describe('PATCH /api/status', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates status and returns the new value', async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });
    const res = await request(app).patch('/api/status').send({ status: 'occupied' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'occupied' });
  });

  it('rejects invalid status values with 400', async () => {
    const res = await request(app).patch('/api/status').send({ status: 'invalid_value' });
    expect(res.status).toBe(400);
  });

  it('rejects missing body with 400', async () => {
    const res = await request(app).patch('/api/status').send({});
    expect(res.status).toBe(400);
  });
});
