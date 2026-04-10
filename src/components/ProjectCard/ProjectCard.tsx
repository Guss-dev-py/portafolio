import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import type { Project } from '../../types';
import { overlayReveal } from '../../motion/variants';
import { spring } from '../../motion/tokens';
import { useReducedMotion } from '../../motion/hooks/useReducedMotion';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
}

const NOOP: Variants = { hidden: {}, visible: {} };

export function ProjectCard({ project }: ProjectCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleActivate = () => {
    if (project.url) window.open(project.url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleActivate();
  };

  const hoverProps = prefersReduced
    ? {}
    : {
        whileHover: {
          y: -6,
          scale: 1.015,
          transition: spring.card,
        },
      };

  return (
    <motion.div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      aria-label={`Ver proyecto: ${project.name}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ willChange: isHovered && !prefersReduced ? 'transform' : 'auto' }}
      {...hoverProps}
    >
      <div className={styles.imageWrapper}>
        {project.imageUrl && !imgError ? (
          <img
            src={project.imageUrl}
            alt={project.imageAlt}
            className={styles.image}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span>{project.name.charAt(0)}</span>
          </div>
        )}
        <div className={styles.overlay}>
          <AnimatePresence>
            {isHovered && (
              <motion.span
                className={styles.overlayText}
                variants={prefersReduced ? NOOP : overlayReveal}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                Ver proyecto →
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{project.name}</h3>
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
