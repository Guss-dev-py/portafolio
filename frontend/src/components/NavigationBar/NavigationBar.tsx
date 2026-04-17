import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import type { SectionId } from '../../types';
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
}

export function NavigationBar({ activeSection }: NavigationBarProps) {
  const navRef = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  const resolvedFadeUp = prefersReduced ? NOOP : fadeUp;
  const resolvedStaggerContainer = prefersReduced
    ? NOOP
    : staggerContainer(stagger.tight, 0.2);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const handleScroll = () => {
      nav.classList.toggle(styles.scrolled, window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
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
      <button
        type="button"
        className={styles.logo}
        onClick={() => handleNav('inicio')}
        aria-label="Ir al inicio"
      >
        AF<span className={styles.logoDot}>.dev</span>
      </button>

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

      <Link to="/admin/login" className={styles.adminDot} aria-label="Panel de administración">
        ·
      </Link>
    </motion.nav>
  );
}
