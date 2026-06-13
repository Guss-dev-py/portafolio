import styles from './admin.module.css';

/** Filas skeleton para las tablas del admin mientras se fetchea. */
export function AdminTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.skelRow}>
          <span className={styles.skelBar} style={{ width: '24px' }} />
          <span className={styles.skelBar} style={{ width: `${45 + (i % 3) * 15}%` }} />
          <span className={styles.skelBar} style={{ width: `${60 - (i % 2) * 20}%` }} />
          <span className={styles.skelBar} style={{ width: '56px' }} />
        </div>
      ))}
    </div>
  );
}
