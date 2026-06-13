import { apiClient } from './client';
import type { Message } from '../types';

// include_deleted: el admin también muestra la papelera
export const getMessages = (signal?: AbortSignal) =>
  apiClient<Message[]>('/api/messages?include_deleted=true', { signal });

export const markAsRead = (id: string) =>
  apiClient<Message>(`/api/messages/${id}/read`, { method: 'PATCH' });

// Soft delete; sobre un mensaje ya en papelera, purga definitiva
export const deleteMessage = (id: string) =>
  apiClient<void>(`/api/messages/${id}`, { method: 'DELETE' });

export const restoreMessage = (id: string) =>
  apiClient<Message>(`/api/messages/${id}/restore`, { method: 'POST' });
