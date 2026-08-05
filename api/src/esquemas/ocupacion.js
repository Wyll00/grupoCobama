import { z } from 'zod';

export const registrarOcupacionSchema = z.object({
  nivel: z.coerce.number().int().min(0).max(4),
  // Aproximado y opcional: en sala no van a contar cabezas, pero si alguien
  // lo apunta, mejor tenerlo.
  comensales: z.coerce.number().int().min(0).max(1000).nullable().optional(),
  nota: z
    .string()
    .max(255)
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
});

export const consultaOcupacionSchema = z.object({
  dias: z.coerce.number().int().min(1).max(365).optional().default(14),
});
