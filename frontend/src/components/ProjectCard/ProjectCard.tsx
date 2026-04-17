import { motion, type Variants } from 'framer-motion';
import type { Project } from '../../types';
import { spring } from '../../motion/tokens';
import { useReducedMotion } from '../../motion/hooks/useReducedMotion';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const NOOP: Variants = { hidden: {}, visible: {} };

export function ProjectCard({ project, index }: ProjectCardProps) {
  const prefersReduced = useReducedMotion();

  const handleActivate = () => {
    if (project.url) window.open(project.url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleActivate();
  };

  const hoverProps = prefersReduced
    ? {}
    : { whileHover: { x: 4, transition: spring.gentle } };

  return (
    <motion.div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      aria-label={`Ver proyecto: ${project.name}`}
      {...hoverProps}
    >
      <span className={styles.number}>
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className={styles.body}>
        <div className={styles.header}>
          <h3 className={styles.name}>{project.name}</h3>
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </div>
        <p className={styles.description}>{project.description}</p>
        <div className={styles.techs}>
          {project.technologies.map((t) => (
            <span key={t} className={styles.tech}>{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Keep NOOP export to avoid unused import warning if needed elsewhere
export { NOOP };
