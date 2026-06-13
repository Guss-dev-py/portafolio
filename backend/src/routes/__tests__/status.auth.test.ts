/**
 * PATCH /api/status rechaza requests sin token válido (401, DB no tocada).
 * GET /api/status sigue siendo público (no requiere token).
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
import statusRouter from '../status';

const testApp = express();
testApp.use(express.json());
testApp.use('/api/status', statusRouter);

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

beforeEach(() => {
  vi.clearAllMocks();
});

function makeValidToken(): string {
  return jwt.sign({ sub: 'admin' }, 'test-secret', { expiresIn: '8h' });
}

function makeExpiredToken(): string {
  return jwt.sign({ sub: 'admin' }, 'test-secret', { expiresIn: -1 });
}

function makeWrongSignatureToken(): string {
  return jwt.sign({ sub: 'admin' }, 'wrong-secret', { expiresIn: '8h' });
}

describe('PATCH /api/status rejects requests without valid token', () => {
  it('no Authorization header → 401, DB not called', async () => {
    const res = await request(testApp)
      .patch('/api/status')
      .send({ status: 'working' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('expired token → 401, DB not called', async () => {
    const res = await request(testApp)
      .patch('/api/status')
      .set('Authorization', `Bearer ${makeExpiredToken()}`)
      .send({ status: 'working' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('wrong signature token → 401, DB not called', async () => {
    const res = await request(testApp)
      .patch('/api/status')
      .set('Authorization', `Bearer ${makeWrongSignatureToken()}`)
      .send({ status: 'working' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('valid token + invalid body → 400 (auth passes, validation rejects)', async () => {
    const res = await request(testApp)
      .patch('/api/status')
      .set('Authorization', `Bearer ${makeValidToken()}`)
      .send({ status: 'not-a-status' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe('GET /api/status stays public', () => {
  it('no Authorization header → 200', async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [{ value: 'open' }] });

    const res = await request(testApp).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'open' });
  });
});
