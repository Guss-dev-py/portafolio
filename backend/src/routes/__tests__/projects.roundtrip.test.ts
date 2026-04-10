/**
 * Feature: portfolio-admin-panel, Property 3: Round-trip de proyecto (crear → leer)
 * Validates: Requirements 1.1, 1.2, 1.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import express from 'express';
import request from 'supertest';

// Mock the pg pool before importing the router
vi.mock('../../db', () => ({
  default: {
    query: vi.fn(),
  },
}));

// Mock auth middleware so we don't need a real JWT
vi.mock('../../middleware/auth', () => ({
  verifyToken: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

import pool from '../../db';
import projectsRouter from '../projects';

// Build a minimal test Express app
const testApp = express();
testApp.use(express.json());
testApp.use('/api/projects', projectsRouter);

// Arbitraries for valid project payloads
const validProjectArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  technologies: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
  url: fc.constant('https://example.com'),
  imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
  imageAlt: fc.string({ minLength: 0, maxLength: 200 }),
});

describe('Property 3: Round-trip de proyecto (crear → leer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/projects returns exactly the same fields that were sent', async () => {
    await fc.assert(
      fc.asyncProperty(validProjectArb, async (payload) => {
        const now = new Date();
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';

        // Mock pool.query to simulate INSERT RETURNING *
        (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
          rows: [
            {
              id: fakeId,
              name: payload.name,
              description: payload.description,
              technologies: payload.technologies,
              url: payload.url,
              image_url: payload.imageUrl,
              image_alt: payload.imageAlt,
              created_at: now,
              updated_at: now,
            },
          ],
        });

        const res = await request(testApp)
          .post('/api/projects')
          .send(payload)
          .set('Content-Type', 'application/json');

        expect(res.status).toBe(201);

        const body = res.body as {
          name: string;
          description: string;
          technologies: string[];
          url: string;
          imageUrl: string;
          imageAlt: string;
        };

        // Round-trip: returned fields must match exactly what was sent
        expect(body.name).toBe(payload.name);
        expect(body.description).toBe(payload.description);
        expect(body.technologies).toEqual(payload.technologies);
        expect(body.url).toBe(payload.url);
        expect(body.imageUrl).toBe(payload.imageUrl);
        expect(body.imageAlt).toBe(payload.imageAlt);
      }),
      { numRuns: 100 },
    );
  });
});
