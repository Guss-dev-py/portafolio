import { apiClient, buildUrl, ApiError } from './client';
import type { Project, ProjectInput } from '../types';

export const getProjects = (signal?: AbortSignal) =>
  apiClient<Project[]>('/api/projects', { signal });

export const createProject = (data: ProjectInput) =>
  apiClient<Project>('/api/projects', { method: 'POST', body: JSON.stringify(data) });

export const updateProject = (id: string, data: ProjectInput) =>
  apiClient<Project>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProject = (id: string) =>
  apiClient<void>(`/api/projects/${id}`, { method: 'DELETE' });

export const reorderProjects = (ids: string[]) =>
  apiClient<void>('/api/projects/reorder', { method: 'PUT', body: JSON.stringify({ ids }) });

// FormData: no va por apiClient porque éste fuerza Content-Type application/json.
export const uploadImage = async (file: File): Promise<{ url: string }> => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch(buildUrl('/api/uploads'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.error ?? `HTTP ${response.status}`);
  }
  return response.json();
};
