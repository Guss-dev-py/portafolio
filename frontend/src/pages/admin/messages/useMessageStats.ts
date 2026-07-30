import { useMemo } from 'react';
import type { Message } from '../../../types';
import { relDateHours } from '../../../utils/date';
import { messagesPerDay } from '../../../utils/messagesPerDay';

export const SPARK_DAYS = 14;

/**
 * Reparte los mensajes en activos y en papelera con un solo recorrido. Lo
 * consumen las stats y los filtros, así que vive aparte para no partirlo dos
 * veces sobre el mismo array.
 */
export function usePartitionedMessages(messages: Message[]) {
  return useMemo(() => {
    const active: Message[] = [];
    const trashed: Message[] = [];
    for (const m of messages) {
      if (m.deletedAt) trashed.push(m); else active.push(m);
    }
    return { active, trashed };
  }, [messages]);
}

/**
 * Contadores y sparkline de la franja superior. Depende sólo de los mensajes
 * activos y del contador de no leídos: tipear en el buscador no tiene por qué
 * recalcular el bucketing de 14 días.
 */
export function useMessageStats(active: Message[], unreadCount: number) {
  return useMemo(() => {
    const buckets = messagesPerDay(active.map(m => m.createdAt), SPARK_DAYS);
    const newest = active.reduce<Message | null>(
      (acc, m) => (!acc || new Date(m.createdAt) > new Date(acc.createdAt) ? m : acc),
      null,
    );
    return {
      activeCount: active.length,
      readCount: active.length - unreadCount,
      lastActivity: newest ? relDateHours(newest.createdAt) : '-',
      sparkBuckets: buckets,
      sparkMax: Math.max(...buckets, 1),
    };
  }, [active, unreadCount]);
}
