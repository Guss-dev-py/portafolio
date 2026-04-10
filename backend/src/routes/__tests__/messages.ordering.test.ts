/**
 * Feature: portfolio-admin-panel, Property 7: Ordenamiento descendente por fecha de creación (mensajes)
 * Validates: Requirement 2.4
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
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
import messagesRouter from '../messages';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

// Build a minimal test Express app
const testApp = express();
testApp.use(express.json());
testApp.use('/api/messages', messagesRouter);

// Arbitrary for a single message row with an arbitrary created_at date
const messageRowArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  message: fc.string({ minLength: 1, maxLength: 2000 }),
  status: fc.constantFrom('unread' as const, 'read' as const),
  created_at: fc.date(),
});

describe('Property 7: Ordenamiento descendente por fecha de creación (mensajes)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/messages returns messages ordered by createdAt descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(messageRowArb, { minLength: 2, maxLength: 10 }),
        async (rows) => {
          // Sort rows by created_at DESC — simulating what the DB does with ORDER BY created_at DESC
          const sortedRows = [...rows].sort(
            (a, b) => b.created_at.getTime() - a.created_at.getTime(),
          );

          // Mock pool.query to return the pre-sorted rows
          (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            rows: sortedRows,
          });

          const res = await request(testApp).get('/api/messages');

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
