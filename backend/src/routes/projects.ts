import { Router, Request, Response, NextFunction } from 'express';
import pool from '../db';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { projectSchema } from '../schemas/project.schema';
import { Project } from '../types';

const router = Router();

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    technologies: row.technologies as string[],
    url: row.url as string,
    imageUrl: row.image_url as string,
    imageAlt: row.image_alt as string,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

// GET /api/projects — lista ordenada por created_at DESC
router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows.map(rowToProject));
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id — retorna proyecto o 404
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }
    res.json(rowToProject(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/projects — inserta y retorna 201 [JWT + validate]
router.post('/', verifyToken, validate(projectSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, technologies, url, imageUrl, imageAlt } = req.body;
    const result = await pool.query(
      'INSERT INTO projects (name, description, technologies, url, image_url, image_alt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, technologies, url, imageUrl, imageAlt]
    );
    res.status(201).json(rowToProject(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id — actualiza o 404 [JWT + validate]
router.put('/:id', verifyToken, validate(projectSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, technologies, url, imageUrl, imageAlt } = req.body;
    const result = await pool.query(
      'UPDATE projects SET name=$1, description=$2, technologies=$3, url=$4, image_url=$5, image_alt=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, description, technologies, url, imageUrl, imageAlt, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }
    res.json(rowToProject(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id — elimina o 404, retorna 204 [JWT]
router.delete('/:id', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
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
