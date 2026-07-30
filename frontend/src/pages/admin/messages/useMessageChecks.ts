import { useCallback, useState } from 'react';
import type { Message } from '../../../types';

/**
 * Selección múltiple para el borrado en lote. Se guarda un `Set` de ids y no
 * los mensajes: sobrevive a que la lista se refetchee y el lookup por fila es
 * constante.
 */
export function useMessageChecks(filtered: Message[]) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setChecked(new Set()), []);

  const allVisibleChecked = filtered.length > 0 && filtered.every(m => checked.has(m.id));

  const toggleAll = useCallback(() => {
    setChecked(allVisibleChecked ? new Set() : new Set(filtered.map(m => m.id)));
  }, [allVisibleChecked, filtered]);

  return { checked, toggle, toggleAll, clear, allVisibleChecked };
}
