import { z } from 'zod';

export const projectSchema = z.object({
  name:         z.string().min(1).max(100),
  description:  z.string().min(1).max(500),
  technologies: z.array(z.string().min(1)).min(1),
  url:          z.string().url().refine((v) => v.startsWith('http://') || v.startsWith('https://'), {
    message: 'URL must start with http:// or https://',
  }),
  imageUrl:     z.string(),
  imageAlt:     z.string(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
