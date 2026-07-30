// Contexto y hook en archivo propio: si conviven con el provider,
// react-refresh no puede hacer fast-refresh del módulo.
import { createContext, use } from 'react';
import type { WorkStatus } from '../api/status';

export interface PublicWorkStatus {
  status: WorkStatus;
  /** `true` hasta que responde `GET /api/status`. */
  loading: boolean;
}

export const WorkStatusContext = createContext<PublicWorkStatus | null>(null);

export function usePublicWorkStatus(): PublicWorkStatus {
  const ctx = use(WorkStatusContext);
  if (!ctx) throw new Error('usePublicWorkStatus debe usarse dentro de WorkStatusProvider');
  return ctx;
}
