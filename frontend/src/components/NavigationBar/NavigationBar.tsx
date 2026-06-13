import { useEffect, useRef, useState } from 'react';
import { scrollToSection } from '../../utils/scroll';
import { useTheme } from '../../hooks/useTheme';
import styles from './NavigationBar.module.css';

const NAV_LINKS = [
  { id: 'inicio',    num: '00', label: 'Inicio' },
  { id: 'sobre',     num: '01', label: 'Sobre mí' },
  { id: 'proyectos', num: '02', label: 'Proyectos' },
  { id: 'contacto',  num: '03', label: 'Contacto' },
];

const NAV_LINKS_REV = [...NAV_LINKS].reverse();

function getActiveSection(): string {
  for (const { id } of NAV_LINKS_REV) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 120) return id;
  }
  return 'inicio';
}

export function NavigationBar() {
  const [active, setActive] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafPending = false;
    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        setActive(getActiveSection());
        rafPending = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // Sincronización inicial vía rAF (onScroll) — setState síncrono en un
    // effect dispara renders en cascada.
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    if (menuOpen) {
      const firstLink = mobileMenuRef.current?.querySelector<HTMLElement>('a');
      firstLink?.focus();
    } else if (wasOpenRef.current) {
      // Solo devolver el foco al hamburger al CERRAR el menú;
      // en el primer render robaría el foco de la página.
      hamburgerRef.current?.focus();
    }
    wasOpenRef.current = menuOpen;
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // El menú declara aria-modal: cerrar con Escape y atrapar Tab adentro.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const links = mobileMenuRef.current?.querySelectorAll<HTMLElement>('a');
      const hamburger = hamburgerRef.current;
      if (!links || links.length === 0 || !hamburger) return;
      const focusables = [hamburger, ...links];
      const idx = focusables.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      const next = e.shiftKey
        ? focusables[(idx - 1 + focusables.length) % focusables.length]
        : focusables[(idx + 1) % focusables.length];
      next.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const handleNavClick = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <>
      <nav className={`${styles.topnav} topnav`} aria-label="Navegación principal">
        <div
          className={styles.brand}
          onClick={() => scrollToSection('inicio')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && scrollToSection('inicio')}
        >
          FREIRE<span className={styles.dot}>.</span>AF
        </div>

        <div className={styles.navLinks}>
          {NAV_LINKS.map(({ id, num, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={active === id ? styles.activeLink : ''}
              onClick={e => { e.preventDefault(); scrollToSection(id); }}
            >
              <span className={styles.num}>{num}</span>{label}
            </a>
          ))}
        </div>

        <div className={styles.topRight}>
          <a href="/admin/login" className={styles.handle}>Guss-dev-py</a>
          <button
            type="button"
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
            title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {theme === 'light' ? '◐' : '◑'}
          </button>
          <a
            href="/cv.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cvBtn}
          >
            CV ↓
          </a>
          <button
            ref={hamburgerRef}
            type="button"
            className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(v => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}
        role="dialog"
        aria-label="Menú de navegación"
        aria-modal="true"
      >
        {NAV_LINKS.map(({ id, num, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`${styles.mobileLink} ${active === id ? styles.activeMobileLink : ''}`}
            onClick={e => { e.preventDefault(); handleNavClick(id); }}
          >
            <span className={styles.num}>{num}</span>{label}
          </a>
        ))}
      </div>
    </>
  );
}
