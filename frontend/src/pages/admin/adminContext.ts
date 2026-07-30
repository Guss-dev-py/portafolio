// Contexto y hook en archivo propio: si conviven con el componente,
// react-refresh no puede hacer fast-refresh del módulo.
import { createContext, use } from 'react';
import type { RefObject } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useMessages } from '../../hooks/useMessages';

export interface AdminContextValue {
  searchRef: RefObject<HTMLInputElement | null>;
  requestOpenCreate: () => void;
  setOpenCreateHandler: (fn: (() => void) | null) => void;
  // Única instancia de cada hook de datos, compartida entre el layout
  // (contadores del statusbar) y las páginas (CRUD). Si cada uno instancia
  // el suyo, los contadores quedan viejos tras crear/borrar.
  projectsApi: ReturnType<typeof useProjects>;
  messagesApi: ReturnType<typeof useMessages>;
}

export const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdminContext(): AdminContextValue {
  const ctx = use(AdminContext);
  if (!ctx) throw new Error('useAdminContext debe usarse dentro de AdminLayout');
  return ctx;
}
