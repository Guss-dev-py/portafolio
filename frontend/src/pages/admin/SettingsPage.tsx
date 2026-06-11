import { useWorkStatus } from '../../hooks/useWorkStatus';
import type { WorkStatus } from '../../api/status';
import styles from './SettingsPage.module.css';

const OPTIONS: { value: WorkStatus; label: string; termLine: string; description: string }[] = [
  {
    value: 'open',
    label: 'Open to work',
    termLine: '> open to work · freelance · full-time',
    description: 'Disponible para proyectos freelance y posiciones full-time.',
  },
  {
    value: 'working',
    label: 'Working',
    termLine: '> working · respondiendo con demoras · GMT-3',
    description: 'Actualmente en un proyecto. Respondo mensajes pero con demoras.',
  },
  {
    value: 'occupied',
    label: 'Occupied',
    termLine: '> occupied · no disponible por ahora',
    description: 'No disponible. Los mensajes quedan guardados.',
  },
];

const DOT_CLASS: Record<WorkStatus, string> = {
  open:     styles.dotOpen,
  working:  styles.dotWorking,
  occupied: styles.dotOccupied,
};

export default function SettingsPage() {
  const { status, loading, saving, error, updateStatus } = useWorkStatus();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <span className={styles.crumbs}>admin / ajustes</span>
        <h1 className={styles.pageTitle}>Ajustes</h1>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>work_status</span>
          <span className={styles.sectionHint}>
            Cambia cómo aparecés en la terminal del portafolio público
          </span>
        </div>

        {loading ? (
          <p className={styles.loadingMsg}>Cargando estado actual...</p>
        ) : (
          <div className={styles.options}>
            {OPTIONS.map((opt) => {
              const active = status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.optionCard} ${active ? styles.optionCardActive : ''}`}
                  onClick={() => !active && updateStatus(opt.value)}
                  disabled={saving}
                  aria-pressed={active}
                >
                  <div className={styles.optionTop}>
                    <span className={`${styles.dot} ${DOT_CLASS[opt.value]}`} />
                    <span className={styles.optionLabel}>{opt.label}</span>
                    {active && <span className={styles.activeBadge}>● ACTIVO</span>}
                  </div>
                  <code className={styles.termPreview}>{opt.termLine}</code>
                  <p className={styles.optionDesc}>{opt.description}</p>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p className={styles.errorMsg} role="alert">Error: {error}</p>
        )}

        {saving && (
          <p className={styles.savingMsg}>Guardando...</p>
        )}
      </div>
    </div>
  );
}
