// Helpers puros del formulario de proyectos. Sin React, sin JSX: se pueden
// testear en aislamiento y no arrastran el componente al importarlos.
import type { Project, ProjectInput } from '../../../types';

/**
 * Estado del formulario: el input que espera la API más el texto crudo del
 * campo de tecnologías. Se guardan los dos porque `technologies` es el array
 * derivado y `technologiesRaw` es lo que el usuario está tipeando (incluida la
 * coma final, que no debe perderse mientras escribe).
 */
export type ProjectFormData = ProjectInput & { technologiesRaw: string };

/**
 * Las dos fábricas declaran las claves en el mismo orden por legibilidad, no
 * por necesidad: `useDirtyForm` serializa ordenando las claves, así que la
 * comparación no depende de eso.
 */
export const emptyForm = (): ProjectFormData => ({
  name: '',
  description: '',
  technologies: [],
  url: '',
  repoUrl: '',
  imageUrl: '',
  imageAlt: '',
  technologiesRaw: '',
});

export const formFromProject = (project: Project): ProjectFormData => ({
  name: project.name,
  description: project.description,
  technologies: project.technologies,
  url: project.url,
  repoUrl: project.repoUrl,
  imageUrl: project.imageUrl,
  imageAlt: project.imageAlt,
  technologiesRaw: project.technologies.join(', '),
});

/** Descarta `technologiesRaw`, que es estado de UI y no viaja a la API. */
export const toInput = (data: ProjectFormData): ProjectInput => ({
  name: data.name,
  description: data.description,
  technologies: data.technologies,
  url: data.url,
  repoUrl: data.repoUrl,
  imageUrl: data.imageUrl,
  imageAlt: data.imageAlt,
});

export function validateForm(data: ProjectInput): Record<string, string> {
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
