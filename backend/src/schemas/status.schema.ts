import { z } from 'zod';

export const workStatusValues = ['open', 'working', 'occupied'] as const;
export type WorkStatus = (typeof workStatusValues)[number];

export const statusSchema = z.object({
  status: z.enum(workStatusValues),
});
