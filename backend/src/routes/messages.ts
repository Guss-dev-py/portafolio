import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db';
import { verifyToken } from '../middleware/auth';
import { Message } from '../types';

const router = Router();

function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    message: row.message as string,
    status: row.status as 'unread' | 'read',
    createdAt: (row.created_at as Date).toISOString(),
  };
}

// GET /api/messages — lista ordenada por created_at DESC
router.get('/', verifyToken, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    const messages: Message[] = result.rows.map(rowToMessage);
    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/messages/:id/read — actualiza status = 'read' o 404
router.patch('/:id/read', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE messages SET status = 'read' WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }
    res.status(200).json(rowToMessage(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/messages/:id — elimina o 404, retorna 204
router.delete('/:id', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
