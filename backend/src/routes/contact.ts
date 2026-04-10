import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db';
import { validate } from '../middleware/validate';
import { contactSchema } from '../schemas/message.schema';
import { Message } from '../types';

const router = Router();

router.post('/', validate(contactSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, message } = req.body as { name: string; email: string; message: string };

    const result = await pool.query(
      'INSERT INTO messages (name, email, message) VALUES ($1, $2, $3) RETURNING *',
      [name, email, message]
    );

    const row = result.rows[0];
    const created: Message = {
      id: row.id,
      name: row.name,
      email: row.email,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    };

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

export default router;
