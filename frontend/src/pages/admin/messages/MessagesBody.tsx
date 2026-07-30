import { AdminTableSkeleton } from '../AdminTableSkeleton';
import { useMessagesPage } from './messagesContext';
import { MessagesTable } from './MessagesTable';
import { MessageDetail } from './MessageDetail';
import styles from '../admin.module.css';

/** Tabla y panel de detalle, o el estado de carga/error que los reemplaza. */
export function MessagesBody() {
  const { loading, error } = useMessagesPage();

  if (loading) return <AdminTableSkeleton />;
  if (error) return <p className={styles.errorText}>Error: {error}</p>;

  return (
    <div className={styles.messagesLayout}>
      <MessagesTable />
      <MessageDetail />
    </div>
  );
}
