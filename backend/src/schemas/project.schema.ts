import { z } from 'zod';

export const projectSchema = z.object({
  name:         z.string().min(1).max(100),
  description:  z.string().min(1).max(500),
  technologies: z.array(z.string().min(1)).min(1),
  url:          z.string().url(),
  repoUrl:      z.string().url().or(z.literal('')).default(''),
  imageUrl:     z.string().url().or(z.literal('')),
  imageAlt:     z.string().max(200),
});

export type ProjectInput = z.infer<typeof projectSchema>;
