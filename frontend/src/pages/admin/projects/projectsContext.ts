// Contexto y hook en archivo propio: si conviven con el provider,
// react-refresh no puede hacer fast-refresh del módulo.
import { createContext, use } from 'react';
import type { Project } from '../../../types';
import type { useReorderDrag } from '../../../motion/hooks/useReorderDrag';
import type { useProjectFilters } from './useProjectFilters';
import type { useProjectForm } from './useProjectForm';

/** Borrado en dos pasos: pedirlo abre el diálogo, confirmarlo llama a la API. */
export interface ProjectDeletion {
  /** Proyecto pendiente de confirmación, o null si no hay ninguno. */
  pending: Project | null;
  request: (project: Project) => void;
  cancel: () => void;
  run: () => Promise<void>;
}

export interface ProjectsPageValue {
  projects: Project[];
  loading: boolean;
  error: string | null;
  filters: ReturnType<typeof useProjectFilters>;
  form: ReturnType<typeof useProjectForm>;
  drag: ReturnType<typeof useReorderDrag>;
  deletion: ProjectDeletion;
  /** Descarga el listado completo como JSON. */
  exportJson: () => void;
}

export const ProjectsPageContext = createContext<ProjectsPageValue | null>(null);

export function useProjectsPage(): ProjectsPageValue {
  const ctx = use(ProjectsPageContext);
  if (!ctx) throw new Error('useProjectsPage debe usarse dentro de ProjectsProvider');
  return ctx;
}
