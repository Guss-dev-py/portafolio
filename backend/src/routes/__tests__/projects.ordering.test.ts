/**
 * Feature: portfolio-admin-panel, Property 7: Ordenamiento descendente por fecha de creación (proyectos)
 * Validates: Requirement 1.1
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

// Mock auth middleware so verifyToken always calls next()
vi.mock('../../middleware/auth', () => ({
  verifyToken: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

import pool from '../../db';
import projectsRouter from '../projects';

// Build a minimal test Express app
const testApp = express();
testApp.use(express.json());
testApp.use('/api/projects', projectsRouter);

// Arbitrary for a single project row with valid created_at and updated_at dates
// fc.date() can generate new Date(NaN) which is not a valid DB timestamp
const projectRowArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  technologies: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
  url: fc.constant('https://example.com'),
  image_url: fc.string({ minLength: 0, maxLength: 200 }),
  image_alt: fc.string({ minLength: 0, maxLength: 200 }),
  created_at: fc.date({ noInvalidDate: true }),
  updated_at: fc.date({ noInvalidDate: true }),
});

describe('Property 7: Ordenamiento descendente por fecha de creación (proyectos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/projects returns projects ordered by createdAt descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(projectRowArb, { minLength: 2, maxLength: 10 }),
        async (rows) => {
          // Sort rows by created_at DESC — simulating what the DB does with ORDER BY created_at DESC
          const sortedRows = [...rows].sort(
            (a, b) => b.created_at.getTime() - a.created_at.getTime(),
          );

          // Mock pool.query to return the pre-sorted rows
          (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            rows: sortedRows,
          });

          const res = await request(testApp).get('/api/projects');

          expect(res.status).toBe(200);

          const body = res.body as Array<{ createdAt: string }>;

          // Verify descending order: createdAt[i] >= createdAt[i+1] for all valid i
          for (let i = 0; i < body.length - 1; i++) {
            const current = new Date(body[i].createdAt).getTime();
            const next = new Date(body[i + 1].createdAt).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
