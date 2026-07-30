import { useMemo } from 'react';
import { relDateDays } from '../../../utils/date';
import { useProjectsPage } from './projectsContext';
import styles from '../admin.module.css';

export function ProjectsStats() {
  const { projects } = useProjectsPage();

  const stats = useMemo(() => {
    const techCount = new Set(projects.flatMap(p => p.technologies)).size;
    if (!projects.length) return { techCount, lastUpdate: '-' };
    const latest = [...projects].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    return { techCount, lastUpdate: relDateDays(latest.updatedAt) };
  }, [projects]);

  return (
    <div className={styles.statsStrip}>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>Total</span>
        <span className={styles.statValue}>{projects.length}</span>
      </div>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>Tecnologías</span>
        <span className={styles.statValue}>{stats.techCount}</span>
      </div>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>Último update</span>
        <span className={styles.statValue}>{stats.lastUpdate}</span>
      </div>
      <div className={styles.statCell}>
        <span className={styles.statLabel}>Repo</span>
        <span className={styles.statValue}>github.com/Guss-dev-py</span>
      </div>
    </div>
  );
}
