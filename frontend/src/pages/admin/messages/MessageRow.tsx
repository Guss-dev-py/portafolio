import type { Message } from '../../../types';
import { relDateHours } from '../../../utils/date';
import { useMessagesPage } from './messagesContext';
import styles from '../admin.module.css';

export function MessageRow({ msg, index }: { msg: Message; index: number }) {
  const { selection, checks, deletion } = useMessagesPage();
  const isUnread = msg.status === 'unread';
  const isSelected = selection.selected?.id === msg.id;

  return (
    <div
      className={`${styles.msgRow} ${isSelected ? styles.selectedRow : ''} ${isUnread ? styles.unreadRow : ''}`}
      onClick={() => selection.select(msg)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selection.select(msg);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      {/* El checkbox corta la propagación: marcarlo para el borrado en lote no
          debe abrir el detalle ni, de paso, marcar el mensaje como leído. */}
      <input
        type="checkbox"
        className={styles.rowCheck}
        aria-label={`Seleccionar mensaje de ${msg.name}`}
        checked={checks.checked.has(msg.id)}
        onChange={() => checks.toggle(msg.id)}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      />
      <span className={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</span>
      <span className={`${styles.statusDot} ${isUnread ? styles.statusDotUnread : styles.statusDotRead}`}>
        {isUnread ? '●' : '○'}
      </span>
      <span className={`${styles.msgName} ${isUnread ? styles.bold : ''}`}>{msg.name}</span>
      <span className={styles.msgEmail}>{msg.email}</span>
      <span className={styles.msgDate}>{relDateHours(msg.createdAt)}</span>
      <span className={`${styles.statusPill} ${isUnread ? styles.pillUnread : styles.pillRead}`}>
        {isUnread ? 'No leído' : 'Leído'}
      </span>
      <button
        type="button"
        className={styles.btnDangerSm}
        onClick={e => { e.stopPropagation(); deletion.request(msg); }}
      >✕</button>
    </div>
  );
}
