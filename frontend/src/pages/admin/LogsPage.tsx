import { useEffect, useState } from 'react';
import { getLogs, type AuditEntry } from '../../api/logs';
import { relDateHours } from '../../utils/date';
import styles from './admin.module.css';

const ACTION_LABEL: Record<string, string> = {
  login_ok: '◆ Login exitoso',
  login_failed: '✕ Login fallido',
  project_created: '+ Proyecto creado',
  project_updated: '~ Proyecto actualizado',
  project_deleted: '− Proyecto eliminado',
  projects_reordered: '⠿ Proyectos reordenados',
  message_trashed: '🗑 Mensaje a papelera',
  message_purged: '✕ Mensaje purgado',
  message_restored: '↩ Mensaje restaurado',
  status_changed: '● Estado de disponibilidad',
  image_uploaded: '▣ Imagen subida',
};

const DANGER_ACTIONS = new Set(['login_failed', 'project_deleted', 'message_purged']);

export default function LogsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getLogs(controller.signal)
      .then(setEntries)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    // `.page` es el contenedor con scroll y esta pantalla es la única del admin
    // que no tiene ni un control adentro: sin foco propio, un usuario de teclado
    // no puede desplazarla (WCAG 2.1.1). Las demás páginas se recorren con sus
    // botones y no necesitan la parada extra.
    <div
      className={styles.page}
      tabIndex={0}
      role="region"
      aria-label="Registro de actividad"
    >
      <div className={styles.pageHeader}>
        <div className={styles.crumbs}>admin / logs</div>
        <h1 className={styles.pageTitle}>Logs</h1>
      </div>

      {loading && <p className={styles.loadingText}>Leyendo registro...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && !error && entries.length === 0 && (
        <div className={styles.empty}>Sin actividad registrada todavía.</div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className={styles.logList}>
          {entries.map((e) => (
            <div key={e.id} className={styles.logRow}>
              <span className={styles.logDate}>{relDateHours(e.createdAt)}</span>
              <span className={`${styles.logAction} ${DANGER_ACTIONS.has(e.action) ? styles.logDanger : ''}`}>
                {ACTION_LABEL[e.action] ?? e.action}
              </span>
              <span className={styles.logDetail}>{e.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
