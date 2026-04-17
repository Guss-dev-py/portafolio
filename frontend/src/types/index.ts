export type SectionId = 'inicio' | 'sobre-mi' | 'proyectos' | 'contacto';

export type Theme = 'dark' | 'light';

export interface SkillTag {
  name: string;
  category: 'frontend' | 'backend' | 'herramientas' | 'otro';
}

export interface SkillGroup {
  category: string;
  skills: SkillTag[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url: string;
  imageUrl: string;
  imageAlt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  description: string;
  technologies: string[];
  url: string;
  imageUrl: string;
  imageAlt: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface ContactLink {
  platform: 'linkedin' | 'github' | 'email' | 'website';
  href: string;
  label: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface FieldError {
  field: keyof ContactFormData;
  message: string;
}
