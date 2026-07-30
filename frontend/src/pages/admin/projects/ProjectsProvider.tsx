import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Project } from '../../../types';
import { useAdminContext } from '../adminContext';
import { useToast } from '../../../components/Toast/toastContext';
import { useReorderDrag } from '../../../motion/hooks/useReorderDrag';
import { ProjectsPageContext, type ProjectsPageValue } from './projectsContext';
import { useProjectFilters } from './useProjectFilters';
import { useProjectForm } from './useProjectForm';

/**
 * Único dueño del estado de la página de proyectos. Compone los hooks y lo
 * publica por contexto, así los componentes de abajo toman lo que necesitan
 * sin que la página tenga que pasarles props que no le importan.
 *
 * El orden de los hooks es significativo: `useReorderDrag` necesita el largo
 * de la lista ya filtrada y si el arrastre está habilitado.
 */
export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { searchRef, setOpenCreateHandler, projectsApi } = useAdminContext();
  const { projects, loading, error, addProject, editProject, removeProject, reorder } = projectsApi;
  const { toast } = useToast();

  const form = useProjectForm({ addProject, editProject });
  const filters = useProjectFilters(projects, searchRef);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  useEffect(() => {
    setOpenCreateHandler(form.openCreate);
    return () => setOpenCreateHandler(null);
  }, [setOpenCreateHandler, form.openCreate]);

  const requestDelete = useCallback((project: Project) => setPendingDelete(project), []);
  const cancelDelete = useCallback(() => setPendingDelete(null), []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [projects]);

  const runDelete = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      await removeProject(pendingDelete.id);
      toast({ title: 'Proyecto eliminado', msg: pendingDelete.name, variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo eliminar el proyecto', variant: 'danger' });
    } finally {
      setPendingDelete(null);
    }
  }, [pendingDelete, removeProject, toast]);

  // Se reordena sobre la lista completa, no sobre `filtered`: el arrastre solo
  // se habilita cuando no hay filtros, así que los índices coinciden.
  const handleReorder = useCallback(async (from: number, to: number) => {
    const ids = projects.map(p => p.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    try {
      await reorder(ids);
      toast({ title: 'Orden actualizado', msg: 'El portfolio público refleja el nuevo orden', variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo guardar el nuevo orden', variant: 'danger' });
    }
  }, [projects, reorder, toast]);

  const drag = useReorderDrag({
    count: filters.filtered.length,
    enabled: filters.canDrag,
    onCommit: handleReorder,
  });

  const value: ProjectsPageValue = {
    projects, loading, error,
    filters, form, drag,
    deletion: { pending: pendingDelete, request: requestDelete, cancel: cancelDelete, run: runDelete },
    exportJson,
  };

  return <ProjectsPageContext value={value}>{children}</ProjectsPageContext>;
}
