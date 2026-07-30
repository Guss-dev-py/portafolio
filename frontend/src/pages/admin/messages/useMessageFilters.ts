import { useMemo, useState } from 'react';
import type { Message } from '../../../types';

export type MessageFilter = 'all' | 'unread' | 'read' | 'trash';

/**
 * Búsqueda y filtro por estado. La papelera es un valor del mismo filtro y no
 * una vista aparte: comparte tabla, detalle y búsqueda, y lo único que cambia
 * son las acciones disponibles sobre el mensaje elegido.
 */
export function useMessageFilters(active: Message[], trashed: Message[]) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MessageFilter>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const base = filter === 'trash' ? trashed : active;
    return base
      .filter(m => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q))
      .filter(m => filter === 'all' || filter === 'trash' || m.status === filter);
  }, [active, trashed, search, filter]);

  return {
    search, setSearch,
    filter, setFilter,
    filtered,
    trashCount: trashed.length,
  };
}
