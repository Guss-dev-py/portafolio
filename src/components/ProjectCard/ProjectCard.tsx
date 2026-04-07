import { useState } from 'react';
import type { Project } from '../../types';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleActivate = () => {
    if (project.url) window.open(project.url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleActivate();
  };

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      aria-label={`Ver proyecto: ${project.name}`}
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
          <span className={styles.overlayText}>Ver proyecto →</span>
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
    </div>
  );
}
