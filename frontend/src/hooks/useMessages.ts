import { useState, useEffect } from 'react';
import type { Message } from '../types';
import { getMessages, markAsRead, deleteMessage, restoreMessage } from '../api/messages';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMessages(controller.signal)
      .then(setMessages)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const readMessage = async (id: string) => {
    const updated = await markAsRead(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  // Activo → papelera (queda con deletedAt); ya en papelera → purga definitiva.
  const removeMessage = async (id: string) => {
    await deleteMessage(id);
    setMessages((prev) =>
      prev.flatMap((m) => {
        if (m.id !== id) return [m];
        return m.deletedAt ? [] : [{ ...m, deletedAt: new Date().toISOString() }];
      })
    );
  };

  const restore = async (id: string) => {
    const restored = await restoreMessage(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? restored : m)));
    return restored;
  };

  const unreadCount = messages.filter((m) => m.status === 'unread' && !m.deletedAt).length;

  return { messages, loading, error, readMessage, removeMessage, restore, unreadCount };
}
