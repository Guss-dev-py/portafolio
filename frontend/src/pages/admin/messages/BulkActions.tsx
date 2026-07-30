import { useMessagesPage } from './messagesContext';
import styles from '../admin.module.css';

/**
 * Sólo existe mientras haya algo seleccionado: un botón de borrado en lote
 * permanentemente visible pero deshabilitado no aporta nada y ocupa lugar en
 * una barra que ya está densa.
 */
export function BulkActions() {
  const { checks, deletion } = useMessagesPage();

  if (checks.checked.size === 0) return null;

  return (
    <button
      type="button"
      className={styles.btnDanger}
      onClick={deletion.requestBulk}
    >
      Eliminar ({checks.checked.size})
    </button>
  );
}
