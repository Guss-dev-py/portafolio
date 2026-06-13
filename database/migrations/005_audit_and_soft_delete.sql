-- 005: Soft-delete de mensajes + audit log del panel admin.

-- Papelera de mensajes: DELETE marca deleted_at; un segundo DELETE purga.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- El listado activo (deleted_at IS NULL) es la consulta caliente: índice parcial.
CREATE INDEX IF NOT EXISTS idx_messages_active_created
  ON messages (created_at DESC)
  WHERE deleted_at IS NULL;

-- Registro de actividad del admin (append-only, sin datos sensibles).
CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action     VARCHAR(40)  NOT NULL,
  entity     VARCHAR(20)  NOT NULL,
  entity_id  TEXT,
  detail     TEXT         NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON audit_log (created_at DESC);
