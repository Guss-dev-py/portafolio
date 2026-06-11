import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import styles from './ConfirmDialog.module.css';

interface Props {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, confirmLabel = 'Confirmar', onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // aria-modal exige foco adentro: entrar al abrir, atrapar Tab entre los dos
  // botones y devolver el foco a quien lo tenía al cerrar.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const target = document.activeElement === cancelRef.current ? confirmRef.current : cancelRef.current;
      target?.focus();
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      previouslyFocused?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          !!! {title}
        </div>
        <div className={styles.body}>{body}</div>
        <div className={styles.footer}>
          <button ref={cancelRef} type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancelar
          </button>
          <button ref={confirmRef} type="button" className={styles.confirmBtn} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
