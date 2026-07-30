import { useProjectsPage } from './projectsContext';
import { ProjectFormPreview } from './ProjectFormPreview';
import styles from '../admin.module.css';

export function ProjectForm() {
  const { form } = useProjectsPage();
  const { open, editing, data, errors, submitting, uploading, change, submit, cancel, uploadFile } = form;

  if (!open) return null;

  return (
    <div className={styles.formCard}>
      <div className={styles.formCardHead}>
        <span>{editing ? `┌─ editando: ${editing.name}` : '┌─ nuevo proyecto'}</span>
        <button type="button" className={styles.closeBtn} onClick={cancel}>✕</button>
      </div>

      {errors.form && (
        <div className={styles.formAlert}>{errors.form}</div>
      )}

      <form onSubmit={submit} noValidate className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="proj-name">NOMBRE *</label>
            <input
              id="proj-name"
              value={data.name}
              onChange={e => change('name', e.target.value)}
              className={errors.name ? styles.inputErr : ''}
            />
            {errors.name && <span className={styles.fieldErr}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="proj-url">URL DEL PROYECTO *</label>
            <input
              id="proj-url"
              value={data.url}
              onChange={e => change('url', e.target.value)}
              placeholder="https://miproyecto.com"
              className={errors.url ? styles.inputErr : ''}
            />
            {errors.url && <span className={styles.fieldErr}>{errors.url}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="proj-repoUrl">URL DEL REPO</label>
            <input
              id="proj-repoUrl"
              value={data.repoUrl}
              onChange={e => change('repoUrl', e.target.value)}
              placeholder="https://github.com/..."
              className={errors.repoUrl ? styles.inputErr : ''}
            />
            {errors.repoUrl && <span className={styles.fieldErr}>{errors.repoUrl}</span>}
          </div>

          <div className={`${styles.field} ${styles.formGridFull}`}>
            <label htmlFor="proj-description">DESCRIPCIÓN *</label>
            <textarea
              id="proj-description"
              value={data.description}
              onChange={e => change('description', e.target.value)}
              rows={3}
              className={errors.description ? styles.inputErr : ''}
            />
            {errors.description && <span className={styles.fieldErr}>{errors.description}</span>}
          </div>

          <div className={`${styles.field} ${styles.formGridFull}`}>
            <label htmlFor="proj-tech">
              TECNOLOGÍAS * <span className={styles.fieldHint}>(separadas por coma)</span>
            </label>
            <input
              id="proj-tech"
              value={data.technologiesRaw}
              onChange={e => change('technologiesRaw', e.target.value)}
              placeholder="React, TypeScript, Node.js"
              className={errors.technologies ? styles.inputErr : ''}
            />
            {data.technologies.length > 0 && (
              <div className={styles.chipPreview}>
                {data.technologies.map(t => (
                  <span key={t} className={styles.chip}>{t}</span>
                ))}
              </div>
            )}
            {errors.technologies && <span className={styles.fieldErr}>{errors.technologies}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="proj-imageUrl">URL IMAGEN</label>
            <input
              id="proj-imageUrl"
              value={data.imageUrl}
              onChange={e => change('imageUrl', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="proj-imageFile">
              SUBIR IMAGEN <span className={styles.fieldHint}>(PNG/JPG/WEBP/GIF, máx 5MB)</span>
            </label>
            <input
              id="proj-imageFile"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={uploadFile}
              disabled={uploading}
            />
            {uploading && <span className={styles.fieldHint}>Subiendo...</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="proj-imageAlt">ALT TEXTO</label>
            <input
              id="proj-imageAlt"
              value={data.imageAlt}
              onChange={e => change('imageAlt', e.target.value)}
            />
          </div>
        </div>

        <ProjectFormPreview />

        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={submitting}>
            {submitting ? 'Guardando...' : editing ? '↵ Guardar cambios' : '↵ Crear proyecto'}
          </button>
          <button type="button" className={styles.btnGhost} onClick={cancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
