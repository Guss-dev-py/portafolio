/**
 * POST /api/contact (público): valida con Zod, persiste el mensaje, envía
 * email vía Resend y escapa HTML en el cuerpo (anti-XSS). El fallo del email
 * no debe impedir guardar el mensaje.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../db', () => ({ default: { query: vi.fn() } }));

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import pool from '../../db';
import contactRouter from '../contact';

const mockedQuery = pool.query as ReturnType<typeof vi.fn>;

const app = express();
app.use(express.json());
app.use('/api/contact', contactRouter);

const validBody = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  message: 'Hola, me interesa trabajar con vos en un proyecto nuevo.',
};

function savedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: validBody.name,
    email: validBody.email,
    message: validBody.message,
    status: 'unread',
    created_at: new Date('2026-06-12T10:00:00Z'),
    deleted_at: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sendMock.mockResolvedValue({ id: 'email-1' });
});

describe('POST /api/contact', () => {
  it('cuerpo válido → 201, persiste el mensaje y envía el email', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [savedRow()] });

    const res = await request(app).post('/api/contact').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(res.body.status).toBe('unread');

    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO messages/i);
    expect(params).toEqual([validBody.name, validBody.email, validBody.message]);
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it('email inválido → 400 y no toca la DB', async () => {
    const res = await request(app).post('/api/contact').send({ ...validBody, email: 'no-es-email' });

    expect(res.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('mensaje demasiado corto → 400', async () => {
    const res = await request(app).post('/api/contact').send({ ...validBody, message: 'corto' });

    expect(res.status).toBe(400);
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('campos faltantes → 400', async () => {
    const res = await request(app).post('/api/contact').send({ name: 'Ana' });
    expect(res.status).toBe(400);
  });

  it('escapa HTML del nombre en el email (anti-XSS)', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [savedRow({ name: '<script>alert(1)</script>' })] });

    await request(app).post('/api/contact').send({
      ...validBody,
      name: '<script>alert(1)</script>',
    });

    const htmlSent = sendMock.mock.calls[0][0].html as string;
    expect(htmlSent).not.toContain('<script>alert(1)</script>');
    expect(htmlSent).toContain('&lt;script&gt;');
  });

  it('si el email falla, igual guarda el mensaje y responde 201', async () => {
    sendMock.mockRejectedValueOnce(new Error('Resend caído'));
    mockedQuery.mockResolvedValueOnce({ rows: [savedRow()] });

    const res = await request(app).post('/api/contact').send(validBody);

    expect(res.status).toBe(201);
    expect(mockedQuery).toHaveBeenCalledOnce();
  });
});
