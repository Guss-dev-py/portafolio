import { useState, useMemo } from 'react';
import { useAdminContext } from './adminContext';
import type { Message } from '../../types';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { AdminTableSkeleton } from './AdminTableSkeleton';
import { useToast } from '../../components/Toast/toastContext';
import { relDateHours } from '../../utils/date';
import { messagesPerDay } from '../../utils/messagesPerDay';
import styles from './admin.module.css';

const SPARK_DAYS = 14;

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
  const { messages, loading, error, readMessage, removeMessage, restore, unreadCount } = messagesApi;
  const { toast } = useToast();
  const [selected, setSelected] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'trash'>('all');
  const [confirmDelete, setConfirmDelete] = useState<Message | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);

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

  const toggleChecked = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = [...checked];
    const results = await Promise.allSettled(ids.map(id => removeMessage(id)));
    const failures = results.filter(r => r.status === 'rejected').length;
    if (selected && checked.has(selected.id)) setSelected(null);
    if (failures === 0) {
      toast({ title: 'Mensajes eliminados', msg: `${ids.length} mensaje(s)`, variant: 'ok' });
    } else {
      toast({ title: 'Error', msg: `No se pudieron eliminar ${failures} mensaje(s)`, variant: 'danger' });
    }
    setChecked(new Set());
    setConfirmBulk(false);
  };

  const handleMarkRead = async (msg: Message) => {
    if (msg.status !== 'unread') return;
    try {
      const updated = await readMessage(msg.id);
      if (selected?.id === msg.id) setSelected(updated);
    } catch { /* non-critical */ }
  };

  const handleRestore = async (msg: Message) => {
    try {
      const restored = await restore(msg.id);
      setSelected(restored);
      toast({ title: 'Mensaje restaurado', msg: `De: ${msg.name}`, variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo restaurar el mensaje', variant: 'danger' });
    }
  };

  const { filtered, activeCount, readCount, trashCount, lastActivity, sparkBuckets, sparkMax } = useMemo(() => {
    const q = search.toLowerCase();
    const active = messages.filter(m => !m.deletedAt);
    const trashed = messages.filter(m => m.deletedAt);
    const base = filter === 'trash' ? trashed : active;
    const filt = base
      .filter(m => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q))
      .filter(m => filter === 'all' || filter === 'trash' || m.status === filter);
    const rc = active.length - unreadCount;
    const sorted = [...active].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const la = sorted.length ? relDateHours(sorted[0].createdAt) : '-';
    const buckets = messagesPerDay(active.map(m => m.createdAt), SPARK_DAYS);
    return {
      filtered: filt,
      activeCount: active.length,
      readCount: rc,
      trashCount: trashed.length,
      lastActivity: la,
      sparkBuckets: buckets,
      sparkMax: Math.max(...buckets, 1),
    };
  }, [messages, search, filter, unreadCount]);

  const allVisibleChecked = filtered.length > 0 && filtered.every(m => checked.has(m.id));
  const toggleAll = () => {
    setChecked(allVisibleChecked ? new Set() : new Set(filtered.map(m => m.id)));
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.crumbs}>admin / mensajes</div>
        <h1 className={styles.pageTitle}>Mensajes</h1>
      </div>

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
          <button
            className={`${styles.filterBtn} ${filter === 'trash' ? styles.filterActive : ''}`}
            onClick={() => setFilter('trash')}
          >Papelera{trashCount > 0 ? ` (${trashCount})` : ''}</button>
        </div>
        {checked.size > 0 && (
          <button
            type="button"
            className={styles.btnDanger}
            onClick={() => setConfirmBulk(true)}
          >
            Eliminar ({checked.size})
          </button>
        )}
      </div>

      {loading && <AdminTableSkeleton />}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && !error && (
        <div className={styles.messagesLayout}>
          <div className={styles.msgTable}>
            <div className={`${styles.msgRow} ${styles.msgHead}`}>
              <input
                type="checkbox"
                className={styles.rowCheck}
                aria-label="Seleccionar todos"
                checked={allVisibleChecked}
                onChange={toggleAll}
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
                  <input
                    type="checkbox"
                    className={styles.rowCheck}
                    aria-label={`Seleccionar mensaje de ${msg.name}`}
                    checked={checked.has(msg.id)}
                    onChange={() => toggleChecked(msg.id)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => e.stopPropagation()}
                  />
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
                  {selected.deletedAt ? (
                    <>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => handleRestore(selected)}
                      >
                        ↩ Restaurar
                      </button>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        onClick={() => setConfirmDelete(selected)}
                      >
                        Eliminar definitivamente
                      </button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
        open={confirmBulk}
        title="Eliminar mensajes"
        body={
          <>¿Eliminar <strong>{checked.size}</strong> mensaje(s) seleccionado(s)? Esta acción no se puede deshacer.</>
        }
        confirmLabel="Eliminar"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulk(false)}
      />

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
