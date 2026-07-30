import { useMessagesPage } from './messagesContext';
import type { MessageFilter } from './useMessageFilters';
import { BulkActions } from './BulkActions';
import styles from '../admin.module.css';

const FILTERS: { mode: MessageFilter; label: string }[] = [
  { mode: 'all', label: 'Todos' },
  { mode: 'unread', label: 'No leídos' },
  { mode: 'read', label: 'Leídos' },
  { mode: 'trash', label: 'Papelera' },
];

export function MessageFilters() {
  const { filters } = useMessagesPage();
  const { search, setSearch, filter, setFilter, trashCount } = filters;

  return (
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
        {FILTERS.map(({ mode, label }) => (
          <button
            key={mode}
            className={`${styles.filterBtn} ${filter === mode ? styles.filterActive : ''}`}
            onClick={() => setFilter(mode)}
          >
            {/* La papelera lleva el contador porque es la única que puede tener
                mensajes que no se ven desde ningún otro filtro. */}
            {mode === 'trash' && trashCount > 0 ? `${label} (${trashCount})` : label}
          </button>
        ))}
      </div>
      <BulkActions />
    </div>
  );
}
