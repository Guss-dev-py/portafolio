import { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import type { Project, ProjectInput } from '../../types';

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
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
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
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Proyectos</h1>
        {!showForm && (
          <button onClick={openCreate} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Agregar proyecto
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '1.25rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #ddd' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>
            {editingProject ? 'Editar proyecto' : 'Nuevo proyecto'}
          </h2>

          {formErrors.form && (
            <p style={{ color: 'red', marginBottom: '1rem' }}>{formErrors.form}</p>
          )}

          <Field label="Nombre *" error={formErrors.name} htmlFor="proj-name">
            <input
              id="proj-name"
              title="Nombre del proyecto"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Descripción *" error={formErrors.description} htmlFor="proj-description">
            <textarea
              id="proj-description"
              title="Descripción del proyecto"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <Field label="Tecnologías * (separadas por coma)" error={formErrors.technologies} htmlFor="proj-technologies">
            <input
              id="proj-technologies"
              value={formData.technologiesRaw}
              onChange={(e) => handleChange('technologiesRaw', e.target.value)}
              placeholder="React, TypeScript, Node.js"
              style={inputStyle}
            />
          </Field>

          <Field label="URL *" error={formErrors.url} htmlFor="proj-url">
            <input
              id="proj-url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://ejemplo.com"
              style={inputStyle}
            />
          </Field>

          <Field label="URL de imagen" error={formErrors.imageUrl} htmlFor="proj-imageUrl">
            <input
              id="proj-imageUrl"
              title="URL de la imagen del proyecto"
              value={formData.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Texto alternativo de imagen" error={formErrors.imageAlt} htmlFor="proj-imageAlt">
            <input
              id="proj-imageAlt"
              title="Texto alternativo de la imagen"
              value={formData.imageAlt}
              onChange={(e) => handleChange('imageAlt', e.target.value)}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
              {submitting ? 'Guardando...' : editingProject ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
            <button type="button" onClick={handleCancel} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading && <p>Cargando proyectos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p style={{ color: '#666' }}>No hay proyectos. Agregá el primero.</p>
      )}

      {projects.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Nombre</th>
              <th style={{ padding: '0.5rem' }}>Tecnologías</th>
              <th style={{ padding: '0.5rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>{project.name}</td>
                <td style={{ padding: '0.5rem', color: '#555' }}>{project.technologies.join(', ')}</td>
                <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEdit(project)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer' }}>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(project)}
                    style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', color: 'white', background: '#c0392b', border: 'none', borderRadius: '4px' }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Field({ label, error, children, htmlFor }: { label: string; error?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>{label}</label>
      {children}
      {error && <span style={{ color: 'red', fontSize: '0.85rem' }}>{error}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.6rem',
  boxSizing: 'border-box',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.95rem',
};
