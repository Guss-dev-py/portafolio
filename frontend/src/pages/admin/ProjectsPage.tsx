import { ProjectsProvider } from './projects/ProjectsProvider';
import { ProjectsHeader } from './projects/ProjectsHeader';
import { ProjectsStats } from './projects/ProjectsStats';
import { ProjectForm } from './projects/ProjectForm';
import { ProjectFilters } from './projects/ProjectFilters';
import { ProjectsTable } from './projects/ProjectsTable';
import { ProjectsDialogs } from './projects/ProjectsDialogs';
import styles from './admin.module.css';

/**
 * Composición de la página. Todo el estado vive en `ProjectsProvider` y cada
 * pieza lo lee del contexto, así que este archivo describe el layout y nada
 * más: agregar o mover una sección no toca ninguna lógica.
 */
export default function ProjectsPage() {
  return (
    <ProjectsProvider>
      <div className={styles.page}>
        <ProjectsHeader />
        <ProjectsStats />
        <ProjectForm />
        <ProjectFilters />
        <ProjectsTable />
        <ProjectsDialogs />
      </div>
    </ProjectsProvider>
  );
}
