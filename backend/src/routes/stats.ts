import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db';
import { verifyToken } from '../middleware/auth';
import { safeIso } from '../utils/date';

const router = Router();

const SPARK_DAYS = 14;

// GET /api/stats — métricas agregadas para el panel [JWT]
router.get('/', verifyToken, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totals = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM projects) AS projects_total,
         (SELECT COUNT(*) FROM messages WHERE deleted_at IS NULL) AS messages_total,
         (SELECT COUNT(*) FROM messages WHERE deleted_at IS NULL AND status = 'unread') AS messages_unread,
         (SELECT MAX(created_at) FROM messages WHERE deleted_at IS NULL) AS last_message_at`
    );
    const perDay = await pool.query(
      `SELECT (created_at AT TIME ZONE 'UTC')::date::text AS day, COUNT(*) AS count
       FROM messages
       WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${SPARK_DAYS} days'
       GROUP BY 1
       ORDER BY 1`
    );

    const t = totals.rows[0];
    res.json({
      projects: { total: Number(t.projects_total) },
      messages: { total: Number(t.messages_total), unread: Number(t.messages_unread) },
      lastMessageAt: t.last_message_at ? safeIso(t.last_message_at) : null,
      messagesPerDay: perDay.rows.map((r) => ({ day: r.day as string, count: Number(r.count) })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
