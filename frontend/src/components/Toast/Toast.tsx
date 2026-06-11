import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { ToastContext } from './toastContext';
import type { ToastInput } from './toastContext';
import styles from './Toast.module.css';

interface Toast {
  id: string;
  title: string;
  msg: string;
  variant: 'ok' | 'danger';
}

function ToastItem({ item, onRemove }: { item: Toast; onRemove: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(item.id), 3200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, onRemove]);

  return (
    <div className={`${styles.toast} ${item.variant === 'danger' ? styles.danger : styles.ok}`}>
      <span className={styles.glyph}>{item.variant === 'danger' ? '!' : '✓'}</span>
      <div className={styles.body}>
        <strong className={styles.title}>{item.title}</strong>
        {item.msg && <span className={styles.msg}>{item.msg}</span>}
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = `t-${Date.now()}-${Math.random()}`;
    setToasts(prev => {
      const next = [...prev, { id, title: input.title, msg: input.msg, variant: input.variant ?? 'ok' }];
      return next.slice(-3);
    });
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className={styles.stack} role="status" aria-live="polite" aria-label="Notificaciones">
          {toasts.map(t => (
            <ToastItem key={t.id} item={t} onRemove={remove} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
