import styles from './RegBar.module.css';

export function RegBar() {
  return (
    <div className={`${styles.regbar} regbar`}>
      <span className={styles.id}>AF / PORTFOLIO / 2026</span>
      <span className={styles.issue}>VOL.01 · ED. BRUTALIST PAPER · IMPRESO EN BUENOS AIRES, AR</span>
      <span className={styles.status}>OPEN TO WORK</span>
      <span className={styles.rates}>EUR / USD / ARS</span>
    </div>
  );
}
