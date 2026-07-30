import type { Message } from '../../../types';
import { gmailReplyUrl } from './messageLinks';
import { useMessagesPage } from './messagesContext';
import styles from '../admin.module.css';

/**
 * Dos variantes explícitas en vez de un componente con un `isTrashed`: las
 * acciones no se solapan en nada. Un mensaje en papelera no se responde, y uno
 * activo no se restaura.
 */

export function ActiveMessageActions({ msg }: { msg: Message }) {
  const { selection, deletion } = useMessagesPage();

  return (
    <>
      <a
        href={gmailReplyUrl(msg)}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.btnPrimary}
      >
        ↪ Responder en Gmail
      </a>
      {msg.status === 'unread' && (
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => selection.markRead(msg)}
        >
          Marcar leído
        </button>
      )}
      <button
        type="button"
        className={styles.btnDanger}
        onClick={() => deletion.request(msg)}
      >
        Eliminar
      </button>
    </>
  );
}

export function TrashedMessageActions({ msg }: { msg: Message }) {
  const { selection, deletion } = useMessagesPage();

  return (
    <>
      <button
        type="button"
        className={styles.btnPrimary}
        onClick={() => selection.restoreMessage(msg)}
      >
        ↩ Restaurar
      </button>
      {/* Segundo DELETE sobre un mensaje ya en papelera: purga definitiva. */}
      <button
        type="button"
        className={styles.btnDanger}
        onClick={() => deletion.request(msg)}
      >
        Eliminar definitivamente
      </button>
    </>
  );
}
