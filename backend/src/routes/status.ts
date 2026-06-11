import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { statusSchema, type WorkStatus } from '../schemas/status.schema';

const router = Router();

// GET /api/status — public
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query<{ value: string }>(
      "SELECT value FROM site_settings WHERE key = 'work_status'"
    );
    const status: WorkStatus = (result.rows[0]?.value as WorkStatus) ?? 'open';
    res.json({ status });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/status — protected
router.patch('/', verifyToken, validate(statusSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body as { status: WorkStatus };
    await pool.query(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES ('work_status', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [status]
    );
    res.json({ status });
  } catch (err) {
    next(err);
  }
});

export default router;
