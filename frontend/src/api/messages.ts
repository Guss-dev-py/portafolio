import { apiClient } from './client';
import type { Message } from '../types';

export const getMessages = (signal?: AbortSignal) =>
  apiClient<Message[]>('/api/messages', { signal });

export const markAsRead = (id: string) =>
  apiClient<Message>(`/api/messages/${id}/read`, { method: 'PATCH' });

export const deleteMessage = (id: string) =>
  apiClient<void>(`/api/messages/${id}`, { method: 'DELETE' });
