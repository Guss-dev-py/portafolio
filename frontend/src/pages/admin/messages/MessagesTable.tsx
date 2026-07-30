import { useMessagesPage } from './messagesContext';
import { MessageRow } from './MessageRow';
import styles from '../admin.module.css';

export function MessagesTable() {
  const { filters, checks } = useMessagesPage();
  const { filtered, search, filter } = filters;

  return (
    <div className={styles.msgTable}>
      <div className={`${styles.msgRow} ${styles.msgHead}`}>
        <input
          type="checkbox"
          className={styles.rowCheck}
          aria-label="Seleccionar todos"
          checked={checks.allVisibleChecked}
          onChange={checks.toggleAll}
        />
        <span>#</span>
        <span>·</span>
        <span>Remitente</span>
        <span>Email</span>
        <span>Recibido</span>
        <span>Estado</span>
        <span>·</span>
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>
          {search || filter !== 'all' ? 'Sin resultados.' : 'No hay mensajes.'}
        </div>
      )}

      {filtered.map((msg, i) => (
        <MessageRow key={msg.id} msg={msg} index={i} />
      ))}
    </div>
  );
}
