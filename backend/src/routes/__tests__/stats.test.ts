/**
 * GET /api/stats: métricas agregadas para el panel (JWT real).
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../../db', () => ({ default: { query: vi.fn() } }));

import pool from '../../db';
import statsRouter from '../stats';

const mockedQuery = pool.query as ReturnType<typeof vi.fn>;

const app = express();
app.use('/api/stats', statsRouter);

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});
beforeEach(() => vi.clearAllMocks());

const token = () => jwt.sign({ sub: 'admin' }, 'test-secret', { expiresIn: '8h' });

describe('GET /api/stats', () => {
  it('sin token → 401, DB no tocada', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('devuelve totales y mensajes por día (solo activos)', async () => {
    mockedQuery
      .mockResolvedValueOnce({
        rows: [{ projects_total: '5', messages_total: '42', messages_unread: '3', last_message_at: new Date('2026-06-12T09:00:00Z') }],
      })
      .mockResolvedValueOnce({
        rows: [
          { day: '2026-06-11', count: '2' },
          { day: '2026-06-12', count: '1' },
        ],
      });

    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      projects: { total: 5 },
      messages: { total: 42, unread: 3 },
      lastMessageAt: '2026-06-12T09:00:00.000Z',
      messagesPerDay: [
        { day: '2026-06-11', count: 2 },
        { day: '2026-06-12', count: 1 },
      ],
    });

    // Las consultas de mensajes excluyen la papelera
    const allSql = mockedQuery.mock.calls.map(c => c[0]).join('\n');
    expect(allSql).toMatch(/deleted_at IS NULL/i);
  });

  it('sin mensajes → lastMessageAt null y serie vacía', async () => {
    mockedQuery
      .mockResolvedValueOnce({
        rows: [{ projects_total: '0', messages_total: '0', messages_unread: '0', last_message_at: null }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${token()}`);

    expect(res.status).toBe(200);
    expect(res.body.lastMessageAt).toBeNull();
    expect(res.body.messagesPerDay).toEqual([]);
  });
});
