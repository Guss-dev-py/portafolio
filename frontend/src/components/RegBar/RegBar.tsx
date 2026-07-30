import { usePublicWorkStatus } from '../../hooks/workStatusContext';
import { STATUS_LABEL } from '../../data/workStatus';
import styles from './RegBar.module.css';

export function RegBar() {
  const { status, loading } = usePublicWorkStatus();

  return (
    <div className={`${styles.regbar} regbar`}>
      <span className={styles.id}>AF / PORTFOLIO / 2026</span>
      <span className={styles.issue}>VOL.01 · ED. BRUTALIST PAPER · IMPRESO EN BUENOS AIRES, AR</span>
      {/* Mientras el fetch está en vuelo la celda queda vacía en vez de asumir
          'open': el default optimista afirmaba disponibilidad durante unos
          cientos de ms aunque el estado real fuera 'occupied'. El `min-width`
          del CSS reserva el ancho de la etiqueta más larga para que no salte. */}
      <span className={`${styles.status} ${loading ? styles.status_loading : styles[`status_${status}`]}`}>
        {loading ? '' : STATUS_LABEL[status]}
      </span>
      <span className={styles.rates}>EUR / USD / ARS</span>
    </div>
  );
}
