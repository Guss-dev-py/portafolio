import { relDateDays } from '../../../utils/date';
import { AdminTableSkeleton } from '../AdminTableSkeleton';
import { useProjectsPage } from './projectsContext';
import { ReorderControls } from './ReorderControls';
import styles from '../admin.module.css';

export function ProjectsTable() {
  const { loading, error, filters, form, drag, deletion } = useProjectsPage();
  const { filtered, canDrag, search, filterTech } = filters;

  if (loading) return <AdminTableSkeleton />;
  if (error) return <p className={styles.errorText}>Error: {error}</p>;

  return (
    <>
      <div className={styles.tableWrapper}>
        <div className={`${styles.tableRow} ${styles.tableHead}`}>
          <span>#</span>
          <span>Nombre</span>
          <span>Descripción</span>
          <span>Tecnologías</span>
          <span>Modificado</span>
          <span>Acciones</span>
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            {search || filterTech ? 'Sin resultados para la búsqueda.' : 'No hay proyectos. Agregá el primero.'}
          </div>
        )}

        {filtered.map((p, i) => (
          <div
            key={p.id}
            // Cuerpo con llaves a propósito: en React 19 lo que devuelve un
            // ref callback se toma como función de cleanup, así que el valor de
            // retorno de `registerRow` no debe filtrarse acá.
            ref={el => { drag.registerRow(i, el); }}
            className={`${styles.tableRow} ${canDrag ? styles.draggableRow : ''} ${drag.draggingIndex === i ? styles.rowDragging : ''}`}
          >
            <ReorderControls index={i} projectName={p.name} />
            <div className={styles.rowName}>
              <div className={styles.rowThumb} aria-hidden="true" />
              <span className={styles.rowNameText}>{p.name}</span>
            </div>
            <span className={styles.rowDesc}>{p.description}</span>
            <div className={styles.rowTech}>
              {p.technologies.slice(0, 3).map(t => (
                <span key={t} className={styles.chip}>{t}</span>
              ))}
              {p.technologies.length > 3 && (
                <span className={styles.chipMore}>+{p.technologies.length - 3}</span>
              )}
            </div>
            <span className={styles.rowDate}>{relDateDays(p.updatedAt)}</span>
            <div className={styles.tableActions}>
              <button className={styles.btnEdit} onClick={() => form.openEdit(p)}>Editar</button>
              <button className={styles.btnDanger} onClick={() => deletion.request(p)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tableFooter}>
        ─── FIN DEL LISTADO · {filtered.length} REGISTRO(S) ───
      </div>
    </>
  );
}
