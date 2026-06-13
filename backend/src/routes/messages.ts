import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db';
import { verifyToken } from '../middleware/auth';
import { validateUuidParam } from '../middleware/validateUuid';
import { Message } from '../types';
import { safeIso } from '../utils/date';
import { audit } from '../utils/audit';

const router = Router();

export function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    message: row.message as string,
    status: row.status as 'unread' | 'read',
    createdAt: safeIso(row.created_at),
    deletedAt: row.deleted_at ? safeIso(row.deleted_at) : null,
  };
}

// GET /api/messages — activos por defecto; ?include_deleted=true incluye la papelera.
// Paginación opcional: con ?page (y ?limit) responde {items,total,page,limit};
// sin params mantiene el array plano (retrocompatible).
router.get('/', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const where = includeDeleted ? '' : 'WHERE deleted_at IS NULL';

    if (req.query.page === undefined && req.query.limit === undefined) {
      const result = await pool.query(`SELECT * FROM messages ${where} ORDER BY created_at DESC`);
      const messages: Message[] = result.rows.map(rowToMessage);
      res.json(messages);
      return;
    }

    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);
    const page = Number.isFinite(rawPage) ? Math.max(Math.trunc(rawPage), 1) : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 20;

    const totalResult = await pool.query(`SELECT COUNT(*) AS total FROM messages ${where}`);
    const listResult = await pool.query(
      `SELECT * FROM messages ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit]
    );
    res.json({
      items: listResult.rows.map(rowToMessage),
      total: Number(totalResult.rows[0].total),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/messages/:id/read — actualiza status = 'read' o 404
router.patch('/:id/read', validateUuidParam(), verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE messages SET status = 'read' WHERE id = $1 AND status != 'read' RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }
    res.json(rowToMessage(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/messages/:id/restore — saca el mensaje de la papelera
router.post('/:id/restore', validateUuidParam(), verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE messages SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }
    audit('message_restored', 'message', id, `de ${result.rows[0].name as string}`);
    res.json(rowToMessage(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/messages/:id — soft delete; sobre uno ya borrado, purga definitiva
router.delete('/:id', validateUuidParam(), verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const soft = await pool.query(
      'UPDATE messages SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    );
    if (soft.rows.length > 0) {
      audit('message_trashed', 'message', id);
      res.status(204).send();
      return;
    }
    const hard = await pool.query(
      'DELETE FROM messages WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id',
      [id]
    );
    if (hard.rows.length === 0) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }
    audit('message_purged', 'message', id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
