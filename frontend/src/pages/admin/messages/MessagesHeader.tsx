import styles from '../admin.module.css';

export function MessagesHeader() {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.crumbs}>admin / mensajes</div>
      <h1 className={styles.pageTitle}>Mensajes</h1>
    </div>
  );
}
