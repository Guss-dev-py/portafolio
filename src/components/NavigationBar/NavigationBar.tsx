import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import type { SectionId, Theme } from '../../types';
import { duration, ease, spring, stagger } from '../../motion/tokens';
import { fadeUp, staggerContainer } from '../../motion/variants';
import { useReducedMotion } from '../../motion/hooks/useReducedMotion';
import styles from './NavigationBar.module.css';

const NOOP: Variants = { hidden: {}, visible: {} };

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
  const navRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  const resolvedFadeUp = prefersReduced ? NOOP : fadeUp;
  const resolvedStaggerContainer = prefersReduced
    ? NOOP
    : staggerContainer(stagger.tight, 0.2);

  // Scroll listener — toggles .scrolled class
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const handleScroll = () => {
      if (window.scrollY > 20) {
        nav.classList.add(styles.scrolled);
      } else {
        nav.classList.remove(styles.scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      ref={navRef}
      className={styles.nav}
      aria-label="Navegación principal"
      initial={prefersReduced ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.slow, ease: ease.expo }}
    >
      <motion.ul
        className={styles.links}
        variants={resolvedStaggerContainer}
        initial="hidden"
        animate="visible"
      >
        {NAV_LINKS.map(({ id, label }) => (
          <motion.li key={id} variants={resolvedFadeUp}>
            <motion.button
              type="button"
              className={`${styles.link} ${styles.linkRelative} ${activeSection === id ? styles.active : ''}`}
              onClick={() => handleNav(id)}
              aria-current={activeSection === id ? 'true' : undefined}
              whileHover={prefersReduced ? undefined : { scale: 1.03 }}
            >
              {activeSection === id && (
                <motion.span
                  className={styles.activeIndicator}
                  layoutId="nav-active-indicator"
                  transition={spring.navIndicator}
                />
              )}
              <span className={styles.linkLabel}>{label}</span>
            </motion.button>
          </motion.li>
        ))}
      </motion.ul>
      <button
        type="button"
        className={styles.themeToggle}
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={theme}
            initial={prefersReduced ? false : { opacity: 0, rotate: -30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
            transition={{ duration: duration.base, ease: ease.back }}
            className={styles.themeIcon}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </motion.span>
        </AnimatePresence>
      </button>
    </motion.nav>
  );
}
