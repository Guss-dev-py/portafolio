import { apiClient } from './client';

export type WorkStatus = 'open' | 'working' | 'occupied';

export function getWorkStatus(signal?: AbortSignal): Promise<{ status: WorkStatus }> {
  return apiClient<{ status: WorkStatus }>('/api/status', { signal });
}

export function setWorkStatus(status: WorkStatus): Promise<{ status: WorkStatus }> {
  return apiClient<{ status: WorkStatus }>('/api/status', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
