import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { getWorkStatus, type WorkStatus } from '../api/status';
import { WorkStatusContext } from './workStatusContext';

/**
 * Un único `GET /api/status` para toda la página pública.
 *
 * El hero y el masthead muestran el mismo dato. Si cada uno hiciera su fetch
 * serían dos requests idénticos en la carga inicial, y podrían quedar
 * desincronizados si uno falla. `useWorkStatus` (el del admin) sigue existiendo
 * aparte porque además escribe.
 */
export function WorkStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WorkStatus>('open');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getWorkStatus(controller.signal)
      .then((r) => setStatus(r.status))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const value = useMemo(() => ({ status, loading }), [status, loading]);

  return <WorkStatusContext value={value}>{children}</WorkStatusContext>;
}
