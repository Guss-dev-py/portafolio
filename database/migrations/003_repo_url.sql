-- 003: URL del repositorio por proyecto.
-- La fila del listado abre `url` (sitio en vivo); "Ver repo" abre `repo_url`.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS repo_url TEXT NOT NULL DEFAULT '';
