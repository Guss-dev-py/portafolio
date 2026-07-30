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
/**
 * @param projectName se usa en el backend para derivar el nombre del archivo.
 *   El nombre de archivo es factor de ranking en búsqueda de imágenes: sin
 *   esto, la subida termina como `imagen-<random>.webp`.
 */
export const uploadImage = async (file: File, projectName?: string): Promise<{ url: string }> => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  // El campo de texto va primero: multer lo expone en req.body a medida que
  // parsea, y así está disponible sin depender del orden de las partes.
  if (projectName) formData.append('name', projectName);
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
