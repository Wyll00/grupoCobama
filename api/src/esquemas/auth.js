import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Email no valido').max(150),
  password: z.string().min(1, 'La contrasena es obligatoria').max(200),
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Indica tu contrasena actual'),
  passwordNueva: z
    .string()
    .min(10, 'Minimo 10 caracteres')
    .max(200, 'Maximo 200 caracteres'),
});
