import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import type { Message } from '../../../types';
import { useAdminContext } from '../adminContext';
import { useToast } from '../../../components/Toast/toastContext';
import { MessagesPageContext, type MessagesPageValue } from './messagesContext';
import { useMessageChecks } from './useMessageChecks';
import { useMessageFilters } from './useMessageFilters';
import { useMessageSelection } from './useMessageSelection';
import { usePartitionedMessages, useMessageStats } from './useMessageStats';

/**
 * Único dueño del estado de la página de mensajes. Compone los hooks y lo
 * publica por contexto; los componentes de abajo no reciben props de estado.
 *
 * El orden importa: los checks necesitan la lista ya filtrada para saber si
 * "seleccionar todos" está completo.
 */
export function MessagesProvider({ children }: { children: ReactNode }) {
  const { messagesApi } = useAdminContext();
  const { messages, loading, error, readMessage, removeMessage, restore, unreadCount } = messagesApi;
  const { toast } = useToast();

  const { active, trashed } = usePartitionedMessages(messages);
  const stats = useMessageStats(active, unreadCount);
  const filters = useMessageFilters(active, trashed);
  const selection = useMessageSelection({ readMessage, restore });
  const checks = useMessageChecks(filters.filtered);
  // Se desestructuran las piezas estables para que los handlers de abajo no
  // dependan de los objetos completos, que se recrean en cada render.
  const { clearIfSelected } = selection;
  const { checked, clear: clearChecks } = checks;

  const [pending, setPending] = useState<Message | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const request = useCallback((msg: Message) => setPending(msg), []);
  const cancel = useCallback(() => setPending(null), []);
  const requestBulk = useCallback(() => setBulkOpen(true), []);
  const cancelBulk = useCallback(() => setBulkOpen(false), []);

  const run = useCallback(async () => {
    if (!pending) return;
    try {
      await removeMessage(pending.id);
      clearIfSelected(pending.id);
      toast({ title: 'Mensaje eliminado', msg: `De: ${pending.name}`, variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo eliminar el mensaje', variant: 'danger' });
    } finally {
      setPending(null);
    }
  }, [pending, removeMessage, clearIfSelected, toast]);

  // `allSettled` y no `all`: si uno falla queremos que los demás igual se
  // borren, y poder decir cuántos quedaron afuera.
  const runBulk = useCallback(async () => {
    const ids = [...checked];
    const results = await Promise.allSettled(ids.map(id => removeMessage(id)));
    const failures = results.filter(r => r.status === 'rejected').length;
    clearIfSelected(checked);
    if (failures === 0) {
      toast({ title: 'Mensajes eliminados', msg: `${ids.length} mensaje(s)`, variant: 'ok' });
    } else {
      toast({ title: 'Error', msg: `No se pudieron eliminar ${failures} mensaje(s)`, variant: 'danger' });
    }
    clearChecks();
    setBulkOpen(false);
  }, [checked, clearChecks, removeMessage, clearIfSelected, toast]);

  const value: MessagesPageValue = {
    messages, loading, error, unreadCount,
    stats, filters, selection, checks,
    deletion: { pending, request, cancel, run, bulkOpen, requestBulk, cancelBulk, runBulk },
  };

  return <MessagesPageContext value={value}>{children}</MessagesPageContext>;
}
