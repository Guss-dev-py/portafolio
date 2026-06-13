/**
 * Soft-delete de mensajes: DELETE marca deleted_at (papelera), un segundo
 * DELETE purga definitivamente, POST /:id/restore restaura. El GET excluye
 * borrados salvo include_deleted=true.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../db', () => ({ default: { query: vi.fn() } }));
vi.mock('../../middleware/auth', () => ({
  verifyToken: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));
vi.mock('../../utils/audit', () => ({ audit: vi.fn() }));

import pool from '../../db';
import messagesRouter from '../messages';

const mockedQuery = pool.query as ReturnType<typeof vi.fn>;
const ID = '550e8400-e29b-41d4-a716-446655440000';

const row = {
  id: ID,
  name: 'Ana',
  email: 'ana@example.com',
  message: 'Hola, quiero hablar de un proyecto.',
  status: 'read',
  created_at: new Date('2026-06-01T12:00:00Z'),
  deleted_at: null,
};

const app = express();
app.use(express.json());
app.use('/api/messages', messagesRouter);

beforeEach(() => vi.clearAllMocks());

describe('GET /api/messages con soft-delete', () => {
  it('por defecto excluye los borrados (WHERE deleted_at IS NULL)', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [row] });

    const res = await request(app).get('/api/messages');

    expect(res.status).toBe(200);
    const [sql] = mockedQuery.mock.calls[0];
    expect(sql).toMatch(/deleted_at IS NULL/i);
  });

  it('con include_deleted=true trae todo y expone deletedAt', async () => {
    const deletedRow = { ...row, deleted_at: new Date('2026-06-10T10:00:00Z') };
    mockedQuery.mockResolvedValueOnce({ rows: [deletedRow] });

    const res = await request(app).get('/api/messages?include_deleted=true');

    expect(res.status).toBe(200);
    const [sql] = mockedQuery.mock.calls[0];
    expect(sql).not.toMatch(/deleted_at IS NULL/i);
    expect(res.body[0].deletedAt).toBeTruthy();
  });
});

describe('DELETE /api/messages/:id en dos pasos', () => {
  it('mensaje activo → soft delete (UPDATE deleted_at) y 204', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ id: ID }] });

    const res = await request(app).delete(`/api/messages/${ID}`);

    expect(res.status).toBe(204);
    const [sql] = mockedQuery.mock.calls[0];
    expect(sql).toMatch(/UPDATE messages SET deleted_at/i);
  });

  it('mensaje ya en papelera → DELETE definitivo y 204', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] })          // soft delete no matchea
      .mockResolvedValueOnce({ rows: [{ id: ID }] }); // purga definitiva

    const res = await request(app).delete(`/api/messages/${ID}`);

    expect(res.status).toBe(204);
    const [sql2] = mockedQuery.mock.calls[1];
    expect(sql2).toMatch(/DELETE FROM messages/i);
    expect(sql2).toMatch(/deleted_at IS NOT NULL/i);
  });

  it('mensaje inexistente → 404', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete(`/api/messages/${ID}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/messages/:id/restore', () => {
  it('restaura un mensaje de la papelera y lo devuelve', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [row] });

    const res = await request(app).post(`/api/messages/${ID}/restore`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ID);
    const [sql] = mockedQuery.mock.calls[0];
    expect(sql).toMatch(/SET deleted_at = NULL/i);
    expect(sql).toMatch(/deleted_at IS NOT NULL/i);
  });

  it('si no está en papelera → 404', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post(`/api/messages/${ID}/restore`);

    expect(res.status).toBe(404);
  });
});
