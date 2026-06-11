import { useState, useEffect } from 'react';
import type { WorkStatus } from '../api/status';
import { getWorkStatus, setWorkStatus } from '../api/status';

export function useWorkStatus() {
  const [status, setStatus] = useState<WorkStatus>('open');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getWorkStatus(controller.signal)
      .then((r) => setStatus(r.status))
      .catch((e) => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const updateStatus = async (next: WorkStatus) => {
    setSaving(true);
    setError(null);
    try {
      const r = await setWorkStatus(next);
      setStatus(r.status);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  return { status, loading, saving, error, updateStatus };
}
