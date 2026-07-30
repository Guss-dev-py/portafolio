import { useMessagesPage } from './messagesContext';
import { SPARK_DAYS } from './useMessageStats';
import styles from '../admin.module.css';

export function MessagesStats() {
  const { stats, unreadCount } = useMessagesPage();
  const { activeCount, readCount, lastActivity, sparkBuckets, sparkMax } = stats;

  return (
    <div className={`${styles.statsStrip} ${styles.statsStripWide}`}>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>Total</span>
        <span className={styles.statValue}>{activeCount}</span>
      </div>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>No leídos</span>
        <span className={`${styles.statValue} ${unreadCount > 0 ? styles.statAccent : ''}`}>
          {unreadCount}
        </span>
      </div>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>Leídos</span>
        <span className={styles.statValue}>{readCount}</span>
      </div>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>Última actividad</span>
        <span className={styles.statValue}>{lastActivity}</span>
      </div>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>Últimos 14 días</span>
        <div
          className={styles.sparkRow}
          role="img"
          aria-label={`Mensajes por día en los últimos ${SPARK_DAYS} días`}
        >
          {sparkBuckets.map((count, i) => (
            <span
              key={i}
              className={`${styles.sparkBar} ${count > 0 ? styles.sparkBarFilled : ''}`}
              style={{ height: `${Math.max((count / sparkMax) * 100, 8)}%` }}
              title={`${count} mensaje(s)`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
