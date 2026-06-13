import { useEffect, useState } from 'react';
import styles from './BackToTop.module.css';

const SHOW_AFTER_PX = 600;

/** Botón flotante para volver al inicio del one-page (visible solo en mobile). */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let rafPending = false;
    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > SHOW_AFTER_PX);
        rafPending = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const handleClick = () => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      className={styles.backToTop}
      onClick={handleClick}
      aria-label="Volver arriba"
      title="Volver arriba"
    >
      ↑
    </button>
  );
}
