import { useState, useMemo } from 'react';
import { useAdminContext } from './adminContext';
import type { Message } from '../../types';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { useToast } from '../../components/Toast/toastContext';
import { relDateHours } from '../../utils/date';
import styles from './admin.module.css';

function gmailReplyUrl(msg: { name: string; email: string; message: string }): string {
  const subject = encodeURIComponent(`Re: mensaje desde el portafolio — ${msg.name}`);
  const body = encodeURIComponent(
    `Hola ${msg.name},\n\n\n\n---\nMensaje original:\n${msg.message}`
  );
  return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(msg.email)}&su=${subject}&body=${body}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MessagesPage() {
  const { messagesApi } = useAdminContext();
  const { messages, loading, error, readMessage, removeMessage, unreadCount } = messagesApi;
  const { toast } = useToast();
  const [selected, setSelected] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [confirmDelete, setConfirmDelete] = useState<Message | null>(null);

  const handleSelect = async (msg: Message) => {
    setSelected(msg);
    if (msg.status === 'unread') {
      try {
        const updated = await readMessage(msg.id);
        setSelected(updated);
      } catch { /* non-critical */ }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await removeMessage(confirmDelete.id);
      if (selected?.id === confirmDelete.id) setSelected(null);
      toast({ title: 'Mensaje eliminado', msg: `De: ${confirmDelete.name}`, variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo eliminar el mensaje', variant: 'danger' });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleMarkRead = async (msg: Message) => {
    if (msg.status !== 'unread') return;
    try {
      const updated = await readMessage(msg.id);
      if (selected?.id === msg.id) setSelected(updated);
    } catch { /* non-critical */ }
  };

  const { filtered, readCount, lastActivity } = useMemo(() => {
    const q = search.toLowerCase();
    const filt = messages
      .filter(m => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q))
      .filter(m => filter === 'all' || m.status === filter);
    const rc = messages.length - unreadCount;
    const sorted = [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const la = sorted.length ? relDateHours(sorted[0].createdAt) : '-';
    return { filtered: filt, readCount: rc, lastActivity: la };
  }, [messages, search, filter, unreadCount]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.crumbs}>admin / mensajes</div>
        <h1 className={styles.pageTitle}>Mensajes</h1>
      </div>

      <div className={styles.statsStrip}>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statValue}>{messages.length}</span>
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
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchGlyph}>/</span>
          <input
            type="text"
            placeholder="buscar mensaje..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilter('all')}
          >Todos</button>
          <button
            className={`${styles.filterBtn} ${filter === 'unread' ? styles.filterActive : ''}`}
            onClick={() => setFilter('unread')}
          >No leídos</button>
          <button
            className={`${styles.filterBtn} ${filter === 'read' ? styles.filterActive : ''}`}
            onClick={() => setFilter('read')}
          >Leídos</button>
        </div>
      </div>

      {loading && <p className={styles.loadingText}>Cargando mensajes...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && !error && (
        <div className={styles.messagesLayout}>
          <div className={styles.msgTable}>
            <div className={`${styles.msgRow} ${styles.msgHead}`}>
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

            {filtered.map((msg, i) => {
              const isUnread = msg.status === 'unread';
              const isSelected = selected?.id === msg.id;
              return (
                <div
                  key={msg.id}
                  className={`${styles.msgRow} ${isSelected ? styles.selectedRow : ''} ${isUnread ? styles.unreadRow : ''}`}
                  onClick={() => handleSelect(msg)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(msg);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                >
                  <span className={styles.rowIndex}>{String(i + 1).padStart(2, '0')}</span>
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
                    onClick={e => { e.stopPropagation(); setConfirmDelete(msg); }}
                  >✕</button>
                </div>
              );
            })}
          </div>

          <div className={styles.detailPane}>
            {selected ? (
              <>
                <div className={styles.detailHead}>
                  <span>MSG · {selected.id.slice(0, 8)}</span>
                  <span className={`${styles.statusPill} ${selected.status === 'unread' ? styles.pillUnread : styles.pillRead}`}>
                    {selected.status === 'unread' ? 'No leído' : 'Leído'}
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
                  <a
                    href={gmailReplyUrl(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.btnPrimary}
                  >
                    ↪ Responder en Gmail
                  </a>
                  {selected.status === 'unread' && (
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() => handleMarkRead(selected)}
                    >
                      Marcar leído
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => setConfirmDelete(selected)}
                  >
                    Eliminar
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.emptyDetail}>
                <pre className={styles.asciiEnv}>{`  ╔═══════════════╗\n  ║  ✉  sin msg   ║\n  ╚═══════════════╝`}</pre>
                <p>{messages.length === 0 ? 'Cuando alguien escriba desde el portfolio, el mensaje aparece acá.' : 'Seleccioná un mensaje'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar mensaje"
        body={
          <>
            ¿Eliminar el mensaje de <strong>{confirmDelete?.name}</strong>?
            {confirmDelete && (
              <p className={styles.confirmSnippet}>
                {confirmDelete.message.slice(0, 80)}...
              </p>
            )}
          </>
        }
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
