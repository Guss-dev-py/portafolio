import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Project, ProjectInput } from '../../types';
import { useAdminContext } from './adminContext';
import { uploadImage } from '../../api/projects';
import { resolveAssetUrl } from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { AdminTableSkeleton } from './AdminTableSkeleton';
import { useToast } from '../../components/Toast/toastContext';
import { relDateDays } from '../../utils/date';
import styles from './admin.module.css';

function validateForm(data: ProjectInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = 'El nombre es requerido';
  if (!data.description.trim()) errors.description = 'La descripción es requerida';
  if (!data.technologies.length) errors.technologies = 'Al menos una tecnología es requerida';
  try { new URL(data.url); } catch { errors.url = 'La URL debe ser válida'; }
  if (data.repoUrl.trim()) {
    try { new URL(data.repoUrl); } catch { errors.repoUrl = 'La URL debe ser válida'; }
  }
  return errors;
}

const emptyForm = (): ProjectInput => ({
  name: '', description: '', technologies: [], url: '', repoUrl: '', imageUrl: '', imageAlt: '',
});


export default function ProjectsPage() {
  const { searchRef, setOpenCreateHandler, projectsApi } = useAdminContext();
  const { projects, loading, error, addProject, editProject, removeProject, reorder } = projectsApi;
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectInput & { technologiesRaw: string }>(
    { ...emptyForm(), technologiesRaw: '' }
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name' | 'manual'>('updated');
  const [filterTech, setFilterTech] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const localSearchRef = useRef<HTMLInputElement | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  // Snapshot del form al abrirlo, para detectar cambios sin guardar al cancelar
  const initialFormRef = useRef<string>('');

  // sync external ref once on mount (refs don't change identity)
  useEffect(() => {
    searchRef.current = localSearchRef.current;
  }, [searchRef]);

  const openCreate = useCallback(() => {
    setEditingProject(null);
    const fresh = { ...emptyForm(), technologiesRaw: '' };
    setFormData(fresh);
    initialFormRef.current = JSON.stringify(fresh);
    setFormErrors({});
    setShowForm(true);
  }, []);

  useEffect(() => {
    setOpenCreateHandler(openCreate);
    return () => setOpenCreateHandler(null);
  }, [setOpenCreateHandler, openCreate]);

  const openEdit = (project: Project) => {
    setEditingProject(project);
    const initial = {
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      technologiesRaw: project.technologies.join(', '),
      url: project.url,
      repoUrl: project.repoUrl,
      imageUrl: project.imageUrl,
      imageAlt: project.imageAlt,
    };
    setFormData(initial);
    initialFormRef.current = JSON.stringify(initial);
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormErrors({});
    setConfirmDiscard(false);
  };

  const handleCancel = () => {
    if (JSON.stringify(formData) !== initialFormRef.current) {
      setConfirmDiscard(true);
      return;
    }
    closeForm();
  };

  const handleChange = (field: keyof ProjectInput | 'technologiesRaw', value: string) => {
    if (field === 'technologiesRaw') {
      const techs = value.split(',').map(t => t.trim()).filter(Boolean);
      setFormData(prev => ({ ...prev, technologiesRaw: value, technologies: techs }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: ProjectInput = {
      name: formData.name,
      description: formData.description,
      technologies: formData.technologies,
      url: formData.url,
      repoUrl: formData.repoUrl,
      imageUrl: formData.imageUrl,
      imageAlt: formData.imageAlt,
    };
    const errs = validateForm(input);
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    setSubmitting(true);
    try {
      if (editingProject) {
        await editProject(editingProject.id, input);
        toast({ title: 'Proyecto actualizado', msg: input.name, variant: 'ok' });
      } else {
        await addProject(input);
        toast({ title: 'Proyecto creado', msg: input.name, variant: 'ok' });
      }
      setShowForm(false);
      setEditingProject(null);
    } catch (err) {
      setFormErrors({ form: err instanceof Error ? err.message : 'Error al guardar' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast({ title: 'Imagen subida', msg: file.name, variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo subir la imagen', variant: 'danger' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await removeProject(confirmDelete.id);
      toast({ title: 'Proyecto eliminado', msg: confirmDelete.name, variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo eliminar el proyecto', variant: 'danger' });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const allTechs = useMemo(
    () => Array.from(new Set(projects.flatMap(p => p.technologies))).sort(),
    [projects],
  );

  const stats = useMemo(() => {
    const techCount = new Set(projects.flatMap(p => p.technologies)).size;
    if (!projects.length) return { techCount, lastUpdate: '-' };
    const latest = [...projects].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    return { techCount, lastUpdate: relDateDays(latest.updatedAt) };
  }, [projects]);

  const filtered = useMemo(() => {
    const matching = projects
      .filter(p => {
        const q = search.toLowerCase();
        return !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      })
      .filter(p => !filterTech || p.technologies.includes(filterTech));
    // En modo manual se respeta el orden del array (= position en DB)
    if (sortBy === 'manual') return matching;
    return matching.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [projects, search, filterTech, sortBy]);

  // Arrastrar solo tiene sentido viendo la lista completa en orden manual
  const canDrag = sortBy === 'manual' && !search && !filterTech;

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDrop = async (targetIndex: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === targetIndex) return;
    const ids = projects.map(p => p.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(targetIndex, 0, moved);
    try {
      await reorder(ids);
      toast({ title: 'Orden actualizado', msg: 'El portfolio público refleja el nuevo orden', variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo guardar el nuevo orden', variant: 'danger' });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.crumbs}>admin / proyectos</div>
        <h1 className={styles.pageTitle}>Proyectos</h1>
        <div className={styles.headerActions}>
          <button className={styles.btnGhost} onClick={handleExport}>Exportar JSON</button>
          <button className={styles.btnPrimary} onClick={openCreate}>+ Nuevo proyecto [n]</button>
        </div>
      </div>

      <div className={styles.statsStrip}>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statValue}>{projects.length}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Tecnologías</span>
          <span className={styles.statValue}>{stats.techCount}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Último update</span>
          <span className={styles.statValue}>{stats.lastUpdate}</span>
        </div>
        <div className={styles.statCell}>
          <span className={styles.statLabel}>Repo</span>
          <span className={styles.statValue}>github.com/Guss-dev-py</span>
        </div>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formCardHead}>
            <span>{editingProject ? `┌─ editando: ${editingProject.name}` : '┌─ nuevo proyecto'}</span>
            <button type="button" className={styles.closeBtn} onClick={handleCancel}>✕</button>
          </div>

          {formErrors.form && (
            <div className={styles.formAlert}>{formErrors.form}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="proj-name">NOMBRE *</label>
                <input
                  id="proj-name"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className={formErrors.name ? styles.inputErr : ''}
                />
                {formErrors.name && <span className={styles.fieldErr}>{formErrors.name}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="proj-url">URL DEL PROYECTO *</label>
                <input
                  id="proj-url"
                  value={formData.url}
                  onChange={e => handleChange('url', e.target.value)}
                  placeholder="https://miproyecto.com"
                  className={formErrors.url ? styles.inputErr : ''}
                />
                {formErrors.url && <span className={styles.fieldErr}>{formErrors.url}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="proj-repoUrl">URL DEL REPO</label>
                <input
                  id="proj-repoUrl"
                  value={formData.repoUrl}
                  onChange={e => handleChange('repoUrl', e.target.value)}
                  placeholder="https://github.com/..."
                  className={formErrors.repoUrl ? styles.inputErr : ''}
                />
                {formErrors.repoUrl && <span className={styles.fieldErr}>{formErrors.repoUrl}</span>}
              </div>

              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label htmlFor="proj-description">DESCRIPCIÓN *</label>
                <textarea
                  id="proj-description"
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  rows={3}
                  className={formErrors.description ? styles.inputErr : ''}
                />
                {formErrors.description && <span className={styles.fieldErr}>{formErrors.description}</span>}
              </div>

              <div className={`${styles.field} ${styles.formGridFull}`}>
                <label htmlFor="proj-tech">
                  TECNOLOGÍAS * <span className={styles.fieldHint}>(separadas por coma)</span>
                </label>
                <input
                  id="proj-tech"
                  value={formData.technologiesRaw}
                  onChange={e => handleChange('technologiesRaw', e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                  className={formErrors.technologies ? styles.inputErr : ''}
                />
                {formData.technologies.length > 0 && (
                  <div className={styles.chipPreview}>
                    {formData.technologies.map(t => (
                      <span key={t} className={styles.chip}>{t}</span>
                    ))}
                  </div>
                )}
                {formErrors.technologies && <span className={styles.fieldErr}>{formErrors.technologies}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="proj-imageUrl">URL IMAGEN</label>
                <input
                  id="proj-imageUrl"
                  value={formData.imageUrl}
                  onChange={e => handleChange('imageUrl', e.target.value)}
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
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <span className={styles.fieldHint}>Subiendo...</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="proj-imageAlt">ALT TEXTO</label>
                <input
                  id="proj-imageAlt"
                  value={formData.imageAlt}
                  onChange={e => handleChange('imageAlt', e.target.value)}
                />
              </div>
            </div>

            {(formData.name || formData.description || formData.technologies.length > 0) && (
              <div className={styles.previewBlock}>
                <span className={styles.previewLabel}>── Vista previa (portfolio público) ──</span>
                <div className={styles.previewRow}>
                  {formData.imageUrl && (
                    <img
                      src={resolveAssetUrl(formData.imageUrl)}
                      alt=""
                      className={styles.previewThumb}
                    />
                  )}
                  <div className={styles.previewBody}>
                    <span className={styles.previewName}>
                      {formData.name || 'nombre'}<span className={styles.previewExt}> .proj</span>
                    </span>
                    <span className={styles.previewDesc}>{formData.description || 'descripción'}</span>
                  </div>
                  <div className={styles.previewTech}>
                    {formData.technologies.slice(0, 3).map(t => (
                      <span key={t} className={styles.chip}>{t}</span>
                    ))}
                    {formData.technologies.length > 3 && (
                      <span className={styles.chipMore}>+{formData.technologies.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.formActions}>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? 'Guardando...' : editingProject ? '↵ Guardar cambios' : '↵ Crear proyecto'}
              </button>
              <button type="button" className={styles.btnGhost} onClick={handleCancel}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchGlyph}>/</span>
          <input
            ref={localSearchRef}
            type="text"
            placeholder="buscar proyecto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <button
            className={`${styles.filterBtn} ${sortBy === 'updated' ? styles.filterActive : ''}`}
            onClick={() => setSortBy('updated')}
          >Modificado</button>
          <button
            className={`${styles.filterBtn} ${sortBy === 'created' ? styles.filterActive : ''}`}
            onClick={() => setSortBy('created')}
          >Creado</button>
          <button
            className={`${styles.filterBtn} ${sortBy === 'name' ? styles.filterActive : ''}`}
            onClick={() => setSortBy('name')}
          >A→Z</button>
          <button
            className={`${styles.filterBtn} ${sortBy === 'manual' ? styles.filterActive : ''}`}
            onClick={() => setSortBy('manual')}
            title="Orden manual: arrastrá las filas para reordenar el portfolio público"
          >Orden</button>
        </div>
        <select
          className={styles.techFilter}
          value={filterTech}
          onChange={e => setFilterTech(e.target.value)}
        >
          <option value="">Todas las techs</option>
          {allTechs.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading && <AdminTableSkeleton />}
      {error && <p className={styles.errorText}>Error: {error}</p>}

      {!loading && !error && (
        <>
          <div className={styles.tableWrapper}>
            <div className={`${styles.tableRow} ${styles.tableHead}`}>
              <span>#</span>
              <span>Nombre</span>
              <span>Descripción</span>
              <span>Tecnologías</span>
              <span>Modificado</span>
              <span>Acciones</span>
            </div>

            {filtered.length === 0 && (
              <div className={styles.empty}>
                {search || filterTech ? 'Sin resultados para la búsqueda.' : 'No hay proyectos. Agregá el primero.'}
              </div>
            )}

            {filtered.map((p, i) => (
              <div
                key={p.id}
                className={`${styles.tableRow} ${canDrag ? styles.draggableRow : ''}`}
                draggable={canDrag}
                onDragStart={canDrag ? () => handleDragStart(i) : undefined}
                onDragOver={canDrag ? (e) => e.preventDefault() : undefined}
                onDrop={canDrag ? () => handleDrop(i) : undefined}
              >
                <span className={styles.rowIndex}>{canDrag ? '⠿' : String(i + 1).padStart(2, '0')}</span>
                <div className={styles.rowName}>
                  <div className={styles.rowThumb} aria-hidden="true" />
                  <span className={styles.rowNameText}>{p.name}</span>
                </div>
                <span className={styles.rowDesc}>{p.description}</span>
                <div className={styles.rowTech}>
                  {p.technologies.slice(0, 3).map(t => (
                    <span key={t} className={styles.chip}>{t}</span>
                  ))}
                  {p.technologies.length > 3 && (
                    <span className={styles.chipMore}>+{p.technologies.length - 3}</span>
                  )}
                </div>
                <span className={styles.rowDate}>{relDateDays(p.updatedAt)}</span>
                <div className={styles.tableActions}>
                  <button className={styles.btnEdit} onClick={() => openEdit(p)}>Editar</button>
                  <button className={styles.btnDanger} onClick={() => setConfirmDelete(p)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.tableFooter}>
            ─── FIN DEL LISTADO · {filtered.length} REGISTRO(S) ───
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        title="Descartar cambios"
        body={<>Hay cambios sin guardar en el formulario. ¿Descartarlos?</>}
        confirmLabel="Descartar"
        onConfirm={closeForm}
        onCancel={() => setConfirmDiscard(false)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar proyecto"
        body={
          <>
            ¿Eliminar <strong>{confirmDelete?.name}</strong>? Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
