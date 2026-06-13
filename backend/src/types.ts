export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url: string;
  repoUrl: string;
  imageUrl: string;
  imageAlt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
  /** Fecha de borrado lógico (papelera); null si está activo. */
  deletedAt: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}
