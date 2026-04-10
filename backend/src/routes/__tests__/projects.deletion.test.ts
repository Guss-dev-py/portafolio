/**
 * Feature: portfolio-admin-panel, Property 6: Eliminación es definitiva (proyectos)
 * Validates: Requirements 1.8, 1.9
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
import projectsRouter from '../projects';

// Build a minimal test Express app
const testApp = express();
testApp.use(express.json());
testApp.use('/api/projects', projectsRouter);

describe('Property 6: Eliminación es definitiva (proyectos)', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tras DELETE exitoso, GET /:id retorna 404 y GET / no incluye el proyecto', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (projectId) => {
        const mockQuery = pool.query as ReturnType<typeof vi.fn>;

        // 1st call: DELETE → returns the deleted row (successful deletion)
        mockQuery.mockResolvedValueOnce({ rows: [{ id: projectId }] });
        // 2nd call: GET /:id → returns empty (project no longer exists)
        mockQuery.mockResolvedValueOnce({ rows: [] });
        // 3rd call: GET / → returns empty list (project not in list)
        mockQuery.mockResolvedValueOnce({ rows: [] });

        // Step 1: DELETE the project
        const deleteRes = await request(testApp)
          .delete(`/api/projects/${projectId}`)
          .set('Authorization', 'Bearer mock-token');

        expect(deleteRes.status).toBe(204);

        // Step 2: GET /:id should return 404
        const getByIdRes = await request(testApp)
          .get(`/api/projects/${projectId}`);

        expect(getByIdRes.status).toBe(404);

        // Step 3: GET / should return empty list (deleted project not present)
        const listRes = await request(testApp)
          .get('/api/projects');

        expect(listRes.status).toBe(200);
        const projects = listRes.body as Array<{ id: string }>;
        const found = projects.some((p) => p.id === projectId);
        expect(found).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
