-- 004: Orden manual de proyectos en el portfolio público.
-- `position` define el orden de aparición (ASC). Se reordena vía
-- PUT /api/projects/reorder desde el panel de admin.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS position INTEGER;

-- Inicializa la posición de filas existentes según su fecha de creación
-- (las más nuevas primero, igual que el orden anterior del listado).
UPDATE projects
SET position = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
  FROM projects
) sub
WHERE projects.id = sub.id AND projects.position IS NULL;
