import { useProjectsPage } from './projectsContext';
import styles from '../admin.module.css';

/**
 * Primera celda de la fila. Sin orden manual es sólo el número; con orden
 * manual se convierte en el asa del gesto, que es también el punto de entrada
 * por teclado (flechas arriba/abajo).
 *
 * El asa es lo único arrastrable y no la fila entera: la fila tiene botones
 * Editar y Eliminar, y hacerla arrastrable completa convertía cualquier click
 * en el comienzo de un gesto.
 */
export function ReorderControls({ index, projectName }: { index: number; projectName: string }) {
  const { filters, drag } = useProjectsPage();

  if (!filters.canDrag) {
    return <span className={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</span>;
  }

  return (
    <button
      type="button"
      className={`${styles.rowIndex} ${styles.dragHandle}`}
      onPointerDown={drag.onPointerDown(index)}
      onKeyDown={drag.onKeyDown(index)}
      aria-label={`Reordenar ${projectName}: arrastrar, o flechas arriba y abajo`}
    >
      ⠿
    </button>
  );
}
