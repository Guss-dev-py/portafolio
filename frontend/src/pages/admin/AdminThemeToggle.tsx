import { useAdminTheme } from '../../hooks/useAdminTheme';
import styles from './AdminLayout.module.css';

/** Conmuta el panel entre el tema papel y el modo hacker (fósforo verde). */
export function AdminThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();
  const isHacker = theme === 'hacker';

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={isHacker ? 'Volver al modo papel' : 'Activar modo hacker'}
      title={isHacker ? 'Volver al modo papel' : 'Activar modo hacker'}
    >
      {isHacker ? '> MODO: HACKER' : '> MODO: PAPER'}
      <span className={styles.themeCursor} aria-hidden="true">_</span>
    </button>
  );
}
