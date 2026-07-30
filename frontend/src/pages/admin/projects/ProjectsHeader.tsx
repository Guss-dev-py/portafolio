import { useProjectsPage } from './projectsContext';
import styles from '../admin.module.css';

export function ProjectsHeader() {
  const { form, exportJson } = useProjectsPage();

  return (
    <div className={styles.pageHeader}>
      <div className={styles.crumbs}>admin / proyectos</div>
      <h1 className={styles.pageTitle}>Proyectos</h1>
      <div className={styles.headerActions}>
        <button className={styles.btnGhost} onClick={exportJson}>Exportar JSON</button>
        <button className={styles.btnPrimary} onClick={form.openCreate}>+ Nuevo proyecto [n]</button>
      </div>
    </div>
  );
}
