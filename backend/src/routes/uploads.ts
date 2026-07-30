import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../middleware/auth';
import { audit } from '../utils/audit';
import { toFileSlug } from '../utils/slug';

const router = Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MAX_DIMENSION = 1200; // los thumbnails del portfolio nunca superan esto

// SVG excluido a propósito: puede embeber scripts (XSS al servirse inline).
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

// En memoria: sharp procesa el buffer y escribimos el webp resultante.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('TIPO_NO_PERMITIDO'));
  },
});

// GET /api/uploads/<archivo> — público (las imágenes se ven en el portfolio)
router.use(express.static(UPLOADS_DIR, { fallthrough: true, index: false }));

// POST /api/uploads — sube una imagen, la optimiza a webp y la guarda [JWT]
router.post('/', verifyToken, (req: Request, res: Response, next: NextFunction): void => {
  upload.single('image')(req, res, async (err: unknown) => {
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
    try {
      // El nombre del archivo es un factor de ranking en búsqueda de imágenes,
      // sólo por debajo del `alt`. Antes era `<timestamp>-<random>.webp`, que no
      // dice nada. Ahora sale del nombre del proyecto, pasado por una lista
      // blanca (ver `toFileSlug`). El sufijo aleatorio se queda: garantiza que
      // dos subidas con el mismo nombre no se pisen, y que nadie pueda
      // sobrescribir la imagen de otro proyecto adivinando su nombre.
      const slug = toFileSlug((req.body as Record<string, unknown> | undefined)?.name);
      const filename = `${slug}-${crypto.randomBytes(6).toString('hex')}.webp`;

      // Segunda barrera. El slug ya hace imposible un `..` o una barra, pero
      // esto verifica el resultado en vez de confiar en el razonamiento: si el
      // destino no queda directamente adentro de UPLOADS_DIR, no se escribe.
      const target = path.join(UPLOADS_DIR, filename);
      if (path.dirname(path.resolve(target)) !== path.resolve(UPLOADS_DIR)) {
        res.status(400).json({ error: 'Nombre de archivo inválido' });
        return;
      }

      await sharp(req.file.buffer)
        // resize solo si excede el límite; nunca agranda (withoutEnlargement)
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(target);

      audit('image_uploaded', 'upload', filename, req.file.originalname);
      res.status(201).json({ url: `/api/uploads/${filename}` });
    } catch {
      res.status(400).json({ error: 'No se pudo procesar la imagen' });
    }
  });
});

export default router;
