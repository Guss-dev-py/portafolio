import type { SectionId, Theme } from '../../types';
import styles from './NavigationBar.module.css';

const NAV_LINKS: { id: SectionId; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'sobre-mi', label: 'Sobre mí' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'contacto', label: 'Contacto' },
];

interface NavigationBarProps {
  activeSection: SectionId;
  theme: Theme;
  onToggleTheme: () => void;
}

export function NavigationBar({ activeSection, theme, onToggleTheme }: NavigationBarProps) {
  const handleNav = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      <ul className={styles.links}>
        {NAV_LINKS.map(({ id, label }) => (
          <li key={id}>
            <button
              type="button"
              className={`${styles.link} ${activeSection === id ? styles.active : ''}`}
              onClick={() => handleNav(id)}
              aria-current={activeSection === id ? 'true' : undefined}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.themeToggle}
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </nav>
  );
}
