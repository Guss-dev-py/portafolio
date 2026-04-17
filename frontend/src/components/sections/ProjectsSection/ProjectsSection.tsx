import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import type { Project } from '../../../types';
import { getProjects } from '../../../api/projects';
import { ProjectCard } from '../../ProjectCard/ProjectCard';
import { fadeUp, staggerContainer } from '../../../motion/variants';
import { stagger } from '../../../motion/tokens';
import { useInView } from '../../../motion/hooks/useInView';
import { useReducedMotion } from '../../../motion/hooks/useReducedMotion';
import styles from './ProjectsSection.module.css';

const NOOP: Variants = { hidden: {}, visible: {} };

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const prefersReduced = useReducedMotion();
  const { ref, isInView } = useInView();

  const headingVariant = prefersReduced ? NOOP : fadeUp;
  const listVariant    = prefersReduced ? NOOP : staggerContainer(stagger.relaxed);
  const cardVariant    = prefersReduced ? NOOP : fadeUp;

  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data))
      .catch(() => setError('No se pudieron cargar los proyectos. Intentá de nuevo más tarde.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="proyectos"
      className={styles.section}
      aria-label="Proyectos"
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div className={styles.container}>
        <motion.p
          className={styles.eyebrow}
          variants={headingVariant}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          // proyectos
        </motion.p>

        <motion.h2
          className={styles.title}
          variants={headingVariant}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Lo que construyo
        </motion.h2>

        <motion.p
          className={styles.subtitle}
          variants={headingVariant}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Proyectos reales con stack completo
        </motion.p>

        {loading && <p className={styles.empty}>Cargando proyectos...</p>}
        {!loading && error && <p className={styles.empty}>{error}</p>}
        {!loading && !error && projects.length === 0 && (
          <p className={styles.empty}>Próximamente...</p>
        )}

        {!loading && !error && projects.length > 0 && (
          <motion.div
            className={styles.grid}
            variants={listVariant}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {projects.map((p, i) => (
              <motion.div key={p.id} variants={cardVariant}>
                <ProjectCard project={p} index={i} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.a
          href="https://github.com/Guss-dev-py"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
          variants={headingVariant}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Ver más en GitHub ↗
        </motion.a>
      </div>
    </section>
  );
}
