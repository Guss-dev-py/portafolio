import { apiClient } from './client';
import type { Project, ProjectInput } from '../types';

export const getProjects = () => apiClient<Project[]>('/api/projects');

export const createProject = (data: ProjectInput) =>
  apiClient<Project>('/api/projects', { method: 'POST', body: JSON.stringify(data) });

export const updateProject = (id: string, data: ProjectInput) =>
  apiClient<Project>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProject = (id: string) =>
  apiClient<void>(`/api/projects/${id}`, { method: 'DELETE' });
