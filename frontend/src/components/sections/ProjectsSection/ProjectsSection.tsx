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
  const gridVariant = prefersReduced ? NOOP : staggerContainer(stagger.relaxed);
  const cardVariant = prefersReduced ? NOOP : fadeUp;

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
        <motion.h2
          className={styles.title}
          variants={headingVariant}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Proyectos
        </motion.h2>
        <motion.p
          className={styles.subtitle}
          variants={headingVariant}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          Algunos de los proyectos en los que trabajé
        </motion.p>

        {loading && <p className={styles.empty}>Cargando proyectos...</p>}

        {!loading && error && <p className={styles.empty}>{error}</p>}

        {!loading && !error && projects.length === 0 && (
          <p className={styles.empty}>Próximamente...</p>
        )}

        {!loading && !error && projects.length > 0 && (
          <motion.div
            className={styles.grid}
            variants={gridVariant}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {projects.map((p) => (
              <motion.div key={p.id} variants={cardVariant}>
                <ProjectCard project={p} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
