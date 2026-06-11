import { useState, useEffect, useCallback } from 'react';
import type { Project, ProjectInput } from '../types';
import { getProjects, createProject, updateProject, deleteProject } from '../api/projects';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refetch = useCallback(() => {
    setError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getProjects(controller.signal)
      .then(setProjects)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [attempt]);

  const addProject = async (data: ProjectInput) => {
    const created = await createProject(data);
    setProjects((prev) => [created, ...prev]);
    return created;
  };

  const editProject = async (id: string, data: ProjectInput) => {
    const updated = await updateProject(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const removeProject = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return { projects, loading, error, refetch, addProject, editProject, removeProject };
}
