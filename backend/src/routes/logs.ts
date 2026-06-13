import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db';
import { verifyToken } from '../middleware/auth';
import { safeIso } from '../utils/date';

const router = Router();

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

// GET /api/logs — actividad reciente del admin [JWT]
router.get('/', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const raw = Number(req.query.limit);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), MAX_LIMIT) : DEFAULT_LIMIT;
    const result = await pool.query(
      'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows.map((row) => ({
      id: row.id as string,
      action: row.action as string,
      entity: row.entity as string,
      entityId: (row.entity_id as string) ?? null,
      detail: row.detail as string,
      createdAt: safeIso(row.created_at),
    })));
  } catch (err) {
    next(err);
  }
});

export default router;
