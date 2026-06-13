import pool from '../db';

/**
 * Registra actividad del admin en audit_log. Fire-and-forget: un fallo de
 * auditoría nunca debe romper la operación principal. Nunca loguear
 * credenciales ni contenido sensible en `detail`.
 */
export function audit(action: string, entity: string, entityId: string | null, detail = ''): void {
  pool
    .query(
      'INSERT INTO audit_log (action, entity, entity_id, detail) VALUES ($1, $2, $3, $4)',
      [action, entity, entityId, detail.slice(0, 300)]
    )
    .catch((err) => console.error('audit_log falló:', err instanceof Error ? err.message : err));
}
