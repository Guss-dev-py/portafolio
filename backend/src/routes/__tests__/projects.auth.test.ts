/**
 * Feature: portfolio-admin-panel, Property 4: Endpoints protegidos rechazan requests sin token válido
 * Validates: Requirements 3.4, 3.5, 3.6
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
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

const FIXED_UUID = '550e8400-e29b-41d4-a716-446655440000';

// Build a minimal test Express app
const testApp = express();
testApp.use(express.json());
testApp.use('/api/projects', projectsRouter);

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Arbitrary for valid project body (satisfies projectSchema)
const validProjectBodyArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  technologies: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
  url: fc.constant('https://example.com'),
  imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
  imageAlt: fc.string({ minLength: 0, maxLength: 200 }),
});

// Arbitrary for a random string ID
const idArb = fc.constant(FIXED_UUID);

function makeExpiredToken(): string {
  return jwt.sign({ sub: 'admin' }, 'test-secret', { expiresIn: -1 });
}

function makeWrongSignatureToken(): string {
  return jwt.sign({ sub: 'admin' }, 'wrong-secret', { expiresIn: '8h' });
}

// ─── POST /api/projects ───────────────────────────────────────────────────────

describe('Property 4: POST /api/projects rejects requests without valid token', () => {
  it('no Authorization header → 401, DB not called', async () => {
    await fc.assert(
      fc.asyncProperty(validProjectBodyArb, async (body) => {
        const res = await request(testApp)
          .post('/api/projects')
          .send(body)
          .set('Content-Type', 'application/json');

        expect(res.status).toBe(401);
        expect(pool.query).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });

  it('expired token → 401, DB not called', async () => {
    await fc.assert(
      fc.asyncProperty(validProjectBodyArb, async (body) => {
        const token = makeExpiredToken();

        const res = await request(testApp)
          .post('/api/projects')
          .set('Authorization', `Bearer ${token}`)
          .send(body)
          .set('Content-Type', 'application/json');

        expect(res.status).toBe(401);
        expect(pool.query).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });

  it('wrong signature token → 401, DB not called', async () => {
    await fc.assert(
      fc.asyncProperty(validProjectBodyArb, async (body) => {
        const token = makeWrongSignatureToken();

        const res = await request(testApp)
          .post('/api/projects')
          .set('Authorization', `Bearer ${token}`)
          .send(body)
          .set('Content-Type', 'application/json');

        expect(res.status).toBe(401);
        expect(pool.query).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });
});

// ─── PUT /api/projects/:id ────────────────────────────────────────────────────

describe('Property 4: PUT /api/projects/:id rejects requests without valid token', () => {
  it('no Authorization header → 401, DB not called', async () => {
    await fc.assert(
      fc.asyncProperty(validProjectBodyArb, idArb, async (body, id) => {
        const res = await request(testApp)
          .put(`/api/projects/${id}`)
          .send(body)
          .set('Content-Type', 'application/json');

        expect(res.status).toBe(401);
        expect(pool.query).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });

  it('expired token → 401, DB not called', async () => {
    await fc.assert(
      fc.asyncProperty(validProjectBodyArb, idArb, async (body, id) => {
        const token = makeExpiredToken();

        const res = await request(testApp)
          .put(`/api/projects/${id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(body)
          .set('Content-Type', 'application/json');

        expect(res.status).toBe(401);
        expect(pool.query).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });

  it('wrong signature token → 401, DB not called', async () => {
    await fc.assert(
      fc.asyncProperty(validProjectBodyArb, idArb, async (body, id) => {
        const token = makeWrongSignatureToken();

        const res = await request(testApp)
          .put(`/api/projects/${id}`)
          .set('Authorization', `Bearer ${token}`)
          .send(body)
          .set('Content-Type', 'application/json');

        expect(res.status).toBe(401);
        expect(pool.query).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });
});

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────

describe('Property 4: DELETE /api/projects/:id rejects requests without valid token', () => {
  it('no Authorization header → 401, DB not called', async () => {
    await fc.assert(
      fc.asyncProperty(idArb, async (id) => {
        const res = await request(testApp)
          .delete(`/api/projects/${id}`);

        expect(res.status).toBe(401);
        expect(pool.query).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });

  it('expired token → 401, DB not called', async () => {
    await fc.assert(
      fc.asyncProperty(idArb, async (id) => {
        const token = makeExpiredToken();

        const res = await request(testApp)
          .delete(`/api/projects/${id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(pool.query).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });

  it('wrong signature token → 401, DB not called', async () => {
    await fc.assert(
      fc.asyncProperty(idArb, async (id) => {
        const token = makeWrongSignatureToken();

        const res = await request(testApp)
          .delete(`/api/projects/${id}`)
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(pool.query).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });
});
