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

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
