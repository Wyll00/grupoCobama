import { z } from 'zod';

const textoOpcional = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v));

export const crearSocioSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
  telefono: textoOpcional(30),
  // No se exige: mucha gente se hace socia en la mesa y no quiere dar correo.
  // Sin email no se le puede avisar del premio, pero puede verlo en su tarjeta.
  email: z.union([z.email('Email no valido').max(150), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v === '' ? null : (v ?? null))),
  restaurante_id: z.coerce.number().int().positive().optional(),
});

export const apuntarVisitaSchema = z.object({
  nota: textoOpcional(160),
  restaurante_id: z.coerce.number().int().positive().optional(),
});

export const entregarPremioSchema = z.object({
  nota: textoOpcional(160),
});

export const buscarSociosSchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
});
