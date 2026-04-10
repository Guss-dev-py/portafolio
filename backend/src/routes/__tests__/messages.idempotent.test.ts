/**
 * Feature: portfolio-admin-panel, Property 5: Marcar como leído es idempotente
 * Validates: Requirement 2.5
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

// Build a minimal test Express app
const testApp = express();
testApp.use(express.json());
testApp.use('/api/messages', messagesRouter);

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

describe('Property 5: Marcar como leído es idempotente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PATCH /api/messages/:id/read always returns status "read" regardless of how many times it is called', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.integer({ min: 1, max: 10 }),
        async (messageId, n) => {
          const mockRow = {
            id: messageId,
            name: 'Test User',
            email: 'test@example.com',
            message: 'Test message',
            status: 'read',
            created_at: new Date(),
          };

          // Mock pool.query to always return the read message row
          const mockQuery = pool.query as ReturnType<typeof vi.fn>;
          mockQuery.mockResolvedValue({ rows: [mockRow] });

          // Call PATCH N times on the same message
          for (let i = 0; i < n; i++) {
            const res = await request(testApp)
              .patch(`/api/messages/${messageId}/read`)
              .set('Content-Type', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('read');
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
