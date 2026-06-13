import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../middleware/auth';

const router = Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// SVG excluido a propósito: puede embeber scripts (XSS al servirse inline).
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype];
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) cb(null, true);
    else cb(new Error('TIPO_NO_PERMITIDO'));
  },
});

// GET /api/uploads/<archivo> — público (las imágenes se ven en el portfolio)
router.use(express.static(UPLOADS_DIR, { fallthrough: true, index: false }));

// POST /api/uploads — sube una imagen [JWT]
router.post('/', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
  upload.single('image')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof Error && (err.message === 'TIPO_NO_PERMITIDO' || err instanceof multer.MulterError)) {
        res.status(400).json({ error: 'Archivo inválido: se aceptan PNG, JPG, WEBP o GIF de hasta 5MB' });
        return;
      }
      next(err);
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Falta el archivo (campo "image")' });
      return;
    }
    res.status(201).json({ url: `/api/uploads/${req.file.filename}` });
  });
});

export default router;
