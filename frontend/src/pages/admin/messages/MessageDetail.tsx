import { useMessagesPage } from './messagesContext';
import { formatDate } from './messageLinks';
import { ActiveMessageActions, TrashedMessageActions } from './MessageDetailActions';
import styles from '../admin.module.css';

export function MessageDetail() {
  const { messages, selection } = useMessagesPage();
  const selected = selection.selected;

  if (!selected) {
    return (
      <div className={styles.detailPane}>
        <div className={styles.emptyDetail}>
          <pre className={styles.asciiEnv}>{`  ╔═══════════════╗\n  ║  ✉  sin msg   ║\n  ╚═══════════════╝`}</pre>
          <p>{messages.length === 0 ? 'Cuando alguien escriba desde el portfolio, el mensaje aparece acá.' : 'Seleccioná un mensaje'}</p>
        </div>
      </div>
    );
  }

  const isUnread = selected.status === 'unread';

  return (
    <div className={styles.detailPane}>
      <div className={styles.detailHead}>
        <span>MSG · {selected.id.slice(0, 8)}</span>
        <span className={`${styles.statusPill} ${isUnread ? styles.pillUnread : styles.pillRead}`}>
          {isUnread ? 'No leído' : 'Leído'}
        </span>
      </div>
      <div className={styles.detailMeta}>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>De</span>
          <span className={styles.metaVal}>{selected.name}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Email</span>
          <a href={`mailto:${selected.email}`} className={styles.metaLink}>{selected.email}</a>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Fecha</span>
          <span className={styles.metaVal}>{formatDate(selected.createdAt)}</span>
        </div>
      </div>
      <div className={styles.detailDivider}>──── MENSAJE ────</div>
      <div className={styles.detailBody}>{selected.message}</div>
      <div className={styles.detailActions}>
        {selected.deletedAt
          ? <TrashedMessageActions msg={selected} />
          : <ActiveMessageActions msg={selected} />}
      </div>
    </div>
  );
}
