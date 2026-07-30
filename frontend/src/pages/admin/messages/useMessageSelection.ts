import { useCallback, useState } from 'react';
import type { Message } from '../../../types';
import type { AdminContextValue } from '../adminContext';
import { useToast } from '../../../components/Toast/toastContext';

type MessagesApi = AdminContextValue['messagesApi'];

interface Options {
  readMessage: MessagesApi['readMessage'];
  restore: MessagesApi['restore'];
}

/**
 * Mensaje abierto en el panel de detalle. Abrirlo lo marca como leído, que es
 * la razón por la que seleccionar es una acción asíncrona y no un `setState`.
 */
export function useMessageSelection({ readMessage, restore }: Options) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Message | null>(null);

  const select = useCallback(async (msg: Message) => {
    setSelected(msg);
    if (msg.status === 'unread') {
      try {
        const updated = await readMessage(msg.id);
        setSelected(updated);
      } catch { /* non-critical */ }
    }
  }, [readMessage]);

  const markRead = useCallback(async (msg: Message) => {
    if (msg.status !== 'unread') return;
    try {
      const updated = await readMessage(msg.id);
      setSelected(prev => (prev?.id === msg.id ? updated : prev));
    } catch { /* non-critical */ }
  }, [readMessage]);

  const restoreMessage = useCallback(async (msg: Message) => {
    try {
      const restored = await restore(msg.id);
      setSelected(restored);
      toast({ title: 'Mensaje restaurado', msg: `De: ${msg.name}`, variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo restaurar el mensaje', variant: 'danger' });
    }
  }, [restore, toast]);

  /** Cierra el detalle si el mensaje abierto es uno de los que se fueron. */
  const clearIfSelected = useCallback((ids: Set<string> | string) => {
    setSelected(prev => {
      if (!prev) return prev;
      const gone = typeof ids === 'string' ? prev.id === ids : ids.has(prev.id);
      return gone ? null : prev;
    });
  }, []);

  return { selected, select, markRead, restoreMessage, clearIfSelected };
}
