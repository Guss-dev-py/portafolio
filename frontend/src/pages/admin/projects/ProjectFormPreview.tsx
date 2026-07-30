import { resolveAssetUrl } from '../../../api/client';
import { useProjectsPage } from './projectsContext';
import styles from '../admin.module.css';

/**
 * Vista previa de cómo va a verse la fila en el portfolio público. Se muestra
 * recién cuando hay algo que mostrar, para que el form no arranque con un
 * bloque de placeholders.
 */
export function ProjectFormPreview() {
  const { form } = useProjectsPage();
  const { data } = form;

  if (!data.name && !data.description && data.technologies.length === 0) return null;

  return (
    <div className={styles.previewBlock}>
      <span className={styles.previewLabel}>── Vista previa (portfolio público) ──</span>
      <div className={styles.previewRow}>
        {data.imageUrl && (
          <img
            src={resolveAssetUrl(data.imageUrl)}
            alt=""
            className={styles.previewThumb}
          />
        )}
        <div className={styles.previewBody}>
          <span className={styles.previewName}>
            {data.name || 'nombre'}<span className={styles.previewExt}> .proj</span>
          </span>
          <span className={styles.previewDesc}>{data.description || 'descripción'}</span>
        </div>
        <div className={styles.previewTech}>
          {data.technologies.slice(0, 3).map(t => (
            <span key={t} className={styles.chip}>{t}</span>
          ))}
          {data.technologies.length > 3 && (
            <span className={styles.chipMore}>+{data.technologies.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  );
}
