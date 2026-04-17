import { useState, useEffect } from 'react';
import type { Message } from '../types';
import { getMessages, markAsRead, deleteMessage } from '../api/messages';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMessages()
      .then(setMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const readMessage = async (id: string) => {
    const updated = await markAsRead(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  const removeMessage = async (id: string) => {
    await deleteMessage(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  return { messages, loading, error, readMessage, removeMessage, unreadCount };
}
