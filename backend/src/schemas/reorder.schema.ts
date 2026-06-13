import { z } from 'zod';

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type ReorderInput = z.infer<typeof reorderSchema>;
