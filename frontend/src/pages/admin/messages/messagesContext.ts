// Contexto y hook en archivo propio: si conviven con el provider,
// react-refresh no puede hacer fast-refresh del módulo.
import { createContext, use } from 'react';
import type { Message } from '../../../types';
import type { useMessageChecks } from './useMessageChecks';
import type { useMessageFilters } from './useMessageFilters';
import type { useMessageSelection } from './useMessageSelection';
import type { useMessageStats } from './useMessageStats';

/**
 * Borrado en dos pasos, individual y en lote. `pending` es el mensaje del
 * diálogo de uno; `bulkOpen` el del diálogo de los seleccionados.
 */
export interface MessageDeletion {
  pending: Message | null;
  request: (msg: Message) => void;
  cancel: () => void;
  run: () => Promise<void>;
  bulkOpen: boolean;
  requestBulk: () => void;
  cancelBulk: () => void;
  runBulk: () => Promise<void>;
}

export interface MessagesPageValue {
  messages: Message[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  stats: ReturnType<typeof useMessageStats>;
  filters: ReturnType<typeof useMessageFilters>;
  selection: ReturnType<typeof useMessageSelection>;
  checks: ReturnType<typeof useMessageChecks>;
  deletion: MessageDeletion;
}

export const MessagesPageContext = createContext<MessagesPageValue | null>(null);

export function useMessagesPage(): MessagesPageValue {
  const ctx = use(MessagesPageContext);
  if (!ctx) throw new Error('useMessagesPage debe usarse dentro de MessagesProvider');
  return ctx;
}
