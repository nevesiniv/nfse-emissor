import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createSaleSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  serviceCode: z.string().min(1),
  buyer: z.object({
    name: z.string().min(1),
    document: z.string().min(11).max(14),
    email: z.string().email().optional(),
  }),
  idempotencyKey: z.string().uuid().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
