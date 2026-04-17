import { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import type { Project, ProjectInput } from '../../types';
import styles from './admin.module.css';

function validateForm(data: ProjectInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = 'El nombre es requerido';
  if (!data.description.trim()) errors.description = 'La descripción es requerida';
  if (!data.technologies.length) errors.technologies = 'Al menos una tecnología es requerida';
  try { new URL(data.url); } catch { errors.url = 'La URL debe ser válida'; }
  return errors;
}

const emptyForm = (): ProjectInput => ({
  name: '',
  description: '',
  technologies: [],
  url: '',
  imageUrl: '',
  imageAlt: '',
});

export default function ProjectsPage() {
  const { projects, loading, error, addProject, editProject, removeProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectInput & { technologiesRaw: string }>(
    { ...emptyForm(), technologiesRaw: '' }
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditingProject(null);
    setFormData({ ...emptyForm(), technologiesRaw: '' });
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      technologiesRaw: project.technologies.join(', '),
      url: project.url,
      imageUrl: project.imageUrl,
      imageAlt: project.imageAlt,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormErrors({});
  };

  const handleChange = (field: keyof ProjectInput | 'technologiesRaw', value: string) => {
    if (field === 'technologiesRaw') {
      const techs = value.split(',').map((t) => t.trim()).filter(Boolean);
      setFormData((prev) => ({ ...prev, technologiesRaw: value, technologies: techs }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: ProjectInput = {
      name: formData.name,
      description: formData.description,
      technologies: formData.technologies,
      url: formData.url,
      imageUrl: formData.imageUrl,
      imageAlt: formData.imageAlt,
    };
    const errors = validateForm(input);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setSubmitting(true);
    try {
      if (editingProject) {
        await editProject(editingProject.id, input);
      } else {
        await addProject(input);
      }
      setShowForm(false);
      setEditingProject(null);
    } catch (err) {
      setFormErrors({ form: err instanceof Error ? err.message : 'Error al guardar el proyecto' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`¿Eliminar el proyecto "${project.name}"?`)) return;
    try {
      await removeProject(project.id);
    } catch {
      alert('Error al eliminar el proyecto');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Proyectos</h1>
        {!showForm && (
          <button className={styles.btnPrimary} onClick={openCreate}>
            + Agregar proyecto
          </button>
        )}
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2 className={styles.formCardTitle}>
            {editingProject ? 'Editar proyecto' : 'Nuevo proyecto'}
          </h2>

          {formErrors.form && (
            <p className={styles.formError}>{formErrors.form}</p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="proj-name">Nombre *</label>
                <input
                  id="proj-name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                {formErrors.name && <span className={styles.fieldError}>{formErrors.name}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="proj-url">URL *</label>
                <input
                  id="proj-url"
                  value={formData.url}
                  onChange={(e) => handleChange('url', e.target.value)}
                  placeholder="https://ejemplo.com"
                />
                {formErrors.url && <span className={styles.fieldError}>{formErrors.url}</span>}
              </div>

              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label htmlFor="proj-description">Descripción *</label>
                <textarea
                  id="proj-description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                />
                {formErrors.description && <span className={styles.fieldError}>{formErrors.description}</span>}
              </div>

              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label htmlFor="proj-technologies">Tecnologías * (separadas por coma)</label>
                <input
                  id="proj-technologies"
                  value={formData.technologiesRaw}
                  onChange={(e) => handleChange('technologiesRaw', e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                />
                {formErrors.technologies && <span className={styles.fieldError}>{formErrors.technologies}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="proj-imageUrl">URL de imagen</label>
                <input
                  id="proj-imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => handleChange('imageUrl', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="proj-imageAlt">Texto alternativo de imagen</label>
                <input
                  id="proj-imageAlt"
                  value={formData.imageAlt}
                  onChange={(e) => handleChange('imageAlt', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Guardando...' : editingProject ? 'Guardar cambios' : 'Crear proyecto'}
              </button>
              <button type="button" className={styles.btnSecondary} onClick={handleCancel}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className={styles.loadingText}>Cargando proyectos...</p>}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && !error && projects.length === 0 && (
        <div className={styles.tableWrapper}>
          <p className={styles.empty}>No hay proyectos. Agregá el primero.</p>
        </div>
      )}

      {projects.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tecnologías</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>
                    <div className={styles.techList}>
                      {project.technologies.map((t) => (
                        <span key={t} className={styles.techTag}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button className={styles.btnEdit} onClick={() => openEdit(project)}>
                        Editar
                      </button>
                      <button className={styles.btnDanger} onClick={() => handleDelete(project)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
