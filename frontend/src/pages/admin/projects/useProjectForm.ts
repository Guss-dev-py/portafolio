import { useCallback, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Project, ProjectInput } from '../../../types';
import type { AdminContextValue } from '../adminContext';
import { uploadImage } from '../../../api/projects';
import { useDirtyForm } from '../../../hooks/useDirtyForm';
import { useToast } from '../../../components/Toast/toastContext';
import {
  emptyForm, formFromProject, toInput, validateForm, type ProjectFormData,
} from './projectForm';

type ProjectsApi = AdminContextValue['projectsApi'];

interface Options {
  addProject: ProjectsApi['addProject'];
  editProject: ProjectsApi['editProject'];
}

/**
 * Todo el estado del formulario de alta/edición: datos, errores, subida de
 * imagen y el chequeo de cambios sin guardar. La página no ve nada de esto.
 */
export function useProjectForm({ addProject, editProject }: Options) {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [data, setData] = useState<ProjectFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // Desestructurado: ambas son estables, y `openCreate` tiene que seguir
  // siéndolo porque el layout la registra en un effect.
  const { snapshot, isDirty } = useDirtyForm<ProjectFormData>();

  /** Estable a propósito: el layout la registra como handler de la tecla [n]. */
  const openCreate = useCallback(() => {
    setEditing(null);
    const fresh = emptyForm();
    setData(fresh);
    snapshot(fresh);
    setErrors({});
    setOpen(true);
  }, [snapshot]);

  const openEdit = useCallback((project: Project) => {
    setEditing(project);
    const initial = formFromProject(project);
    setData(initial);
    snapshot(initial);
    setErrors({});
    setOpen(true);
  }, [snapshot]);

  const close = useCallback(() => {
    setOpen(false);
    setEditing(null);
    setErrors({});
    setConfirmDiscard(false);
  }, []);

  const cancel = useCallback(() => {
    if (isDirty(data)) {
      setConfirmDiscard(true);
      return;
    }
    close();
  }, [data, isDirty, close]);

  const change = useCallback((field: keyof ProjectInput | 'technologiesRaw', value: string) => {
    if (field === 'technologiesRaw') {
      const techs = value.split(',').map(t => t.trim()).filter(Boolean);
      setData(prev => ({ ...prev, technologiesRaw: value, technologies: techs }));
    } else {
      setData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  const submit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const input = toInput(data);
    const errs = validateForm(input);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      if (editing) {
        await editProject(editing.id, input);
        toast({ title: 'Proyecto actualizado', msg: input.name, variant: 'ok' });
      } else {
        await addProject(input);
        toast({ title: 'Proyecto creado', msg: input.name, variant: 'ok' });
      }
      setOpen(false);
      setEditing(null);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Error al guardar' });
    } finally {
      setSubmitting(false);
    }
  }, [data, editing, addProject, editProject, toast]);

  const uploadFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // El nombre que ya tipeó el admin viaja con la subida para que el archivo
      // quede con un nombre descriptivo y no `imagen-<random>.webp`.
      const { url } = await uploadImage(file, data.name);
      setData(prev => ({ ...prev, imageUrl: url }));
      toast({ title: 'Imagen subida', msg: file.name, variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo subir la imagen', variant: 'danger' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
    // `data.name` y no `data`: la dependencia primitiva evita recrear el
    // callback en cada tecla de cualquier otro campo del formulario.
  }, [toast, data.name]);

  return {
    open, editing, data, errors, submitting, uploading, confirmDiscard,
    openCreate, openEdit, close, cancel, change, submit, uploadFile,
    dismissDiscard: () => setConfirmDiscard(false),
  };
}
