import type { Project } from '../../../types';
import { ProjectCard } from '../../ProjectCard/ProjectCard';
import styles from './ProjectsSection.module.css';

interface ProjectsSectionProps {
  projects: Project[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section id="proyectos" className={styles.section} aria-label="Proyectos">
      <div className={styles.container}>
        <h2 className={styles.title}>Proyectos</h2>
        <p className={styles.subtitle}>Algunos de los proyectos en los que trabajé</p>

        {projects.length === 0 ? (
          <p className={styles.empty}>Próximamente...</p>
        ) : (
          <div className={styles.grid}>
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
