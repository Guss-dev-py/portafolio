import { useState } from 'react';
import { useMessages } from '../../hooks/useMessages';
import type { Message } from '../../types';
import styles from './admin.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessagesPage() {
  const { messages, loading, error, readMessage, removeMessage } = useMessages();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const handleSelect = async (msg: Message) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      try {
        const updated = await readMessage(msg.id);
        setSelectedMessage(updated);
      } catch {
        // non-critical
      }
    }
  };

  const handleDelete = async (msg: Message) => {
    if (!window.confirm(`¿Eliminar el mensaje de "${msg.name}"?`)) return;
    try {
      await removeMessage(msg.id);
      if (selectedMessage?.id === msg.id) setSelectedMessage(null);
    } catch {
      alert('Error al eliminar el mensaje');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Mensajes</h1>
      </div>

      {loading && <p className={styles.loadingText}>Cargando mensajes...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && !error && messages.length === 0 && (
        <div className={styles.tableWrapper}>
          <p className={styles.empty}>No hay mensajes.</p>
        </div>
      )}

      {!loading && !error && messages.length > 0 && (
        <div className={styles.messagesLayout}>
          <div className={styles.messagesTable}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Remitente</th>
                    <th>Email</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => {
                    const isUnread = msg.status === 'unread';
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <tr
                        key={msg.id}
                        onClick={() => handleSelect(msg)}
                        className={`
                          ${isSelected ? styles.selected : ''}
                          ${isUnread ? styles.unread : ''}
                        `}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{msg.name}</td>
                        <td style={{ color: 'var(--text)' }}>{msg.email}</td>
                        <td style={{ color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          {formatDate(msg.createdAt)}
                        </td>
                        <td>
                          {isUnread ? (
                            <span className={styles.statusUnread}>● No leído</span>
                          ) : (
                            <span className={styles.statusRead}>Leído</span>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={styles.btnDanger}
                            onClick={() => handleDelete(msg)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedMessage && (
            <div className={styles.detailPanel}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>Detalle del mensaje</h2>
                <button
                  type="button"
                  className={styles.detailClose}
                  onClick={() => setSelectedMessage(null)}
                  aria-label="Cerrar detalle"
                >
                  ✕
                </button>
              </div>

              <p className={styles.detailMeta}>
                <strong>De:</strong> {selectedMessage.name}
              </p>
              <p className={styles.detailMeta}>
                <strong>Email:</strong> {selectedMessage.email}
              </p>
              <p className={styles.detailDate}>
                {formatDate(selectedMessage.createdAt)}
              </p>

              <hr className={styles.detailDivider} />

              <p className={styles.detailBody}>{selectedMessage.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
