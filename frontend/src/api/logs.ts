import { apiClient } from './client';

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string;
  createdAt: string;
}

export const getLogs = (signal?: AbortSignal) =>
  apiClient<AuditEntry[]>('/api/logs', { signal });
