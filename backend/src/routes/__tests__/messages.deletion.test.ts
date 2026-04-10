/**
 * Feature: portfolio-admin-panel, Property 6: Eliminación es definitiva (mensajes)
 * Validates: Requirements 2.7, 2.8
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

describe('Property 6: Eliminación es definitiva (mensajes)', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tras DELETE exitoso, GET /api/messages no incluye el mensaje eliminado', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (messageId) => {
        const mockQuery = pool.query as ReturnType<typeof vi.fn>;

        // 1st call: DELETE → returns the deleted row (successful deletion)
        mockQuery.mockResolvedValueOnce({ rows: [{ id: messageId }] });
        // 2nd call: GET / → returns empty list (message no longer present)
        mockQuery.mockResolvedValueOnce({ rows: [] });

        // Step 1: DELETE the message
        const deleteRes = await request(testApp)
          .delete(`/api/messages/${messageId}`)
          .set('Authorization', 'Bearer mock-token');

        expect(deleteRes.status).toBe(204);

        // Step 2: GET /api/messages should not include the deleted message
        const listRes = await request(testApp)
          .get('/api/messages')
          .set('Authorization', 'Bearer mock-token');

        expect(listRes.status).toBe(200);
        const messages = listRes.body as Array<{ id: string }>;
        const found = messages.some((m) => m.id === messageId);
        expect(found).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
