import { z } from 'zod';

const base = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
  email: z.email('Email no valido').max(150),
  rol: z.enum(['admin_grupo', 'encargado_local']),
  restaurante_id: z.coerce.number().int().positive().nullable().optional(),
  activo: z.boolean().optional().default(true),
});

/**
 * El esquema replica el CHECK de la tabla: admin de grupo sin local,
 * encargado con local. Validarlo aqui devuelve un 400 con un mensaje util en
 * lugar de dejar que estalle el CHECK de MySQL con un error opaco.
 */
const coherenciaAmbito = (datos, ctx) => {
  if (datos.rol === 'admin_grupo' && datos.restaurante_id != null) {
    ctx.addIssue({
      code: 'custom',
      path: ['restaurante_id'],
      message: 'Un admin de grupo no se asigna a ningun local',
    });
  }
  if (datos.rol === 'encargado_local' && datos.restaurante_id == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['restaurante_id'],
      message: 'Un encargado necesita un local asignado',
    });
  }
};

export const crearUsuarioSchema = base
  .extend({
    password: z.string().min(10, 'Minimo 10 caracteres').max(200),
  })
  .superRefine(coherenciaAmbito);

export const actualizarUsuarioSchema = base
  .extend({
    password: z.string().min(10, 'Minimo 10 caracteres').max(200).optional(),
  })
  .partial()
  .superRefine((datos, ctx) => {
    if (Object.keys(datos).length === 0) {
      ctx.addIssue({ code: 'custom', message: 'No hay ningun cambio que aplicar' });
      return;
    }
    // Solo se comprueba la coherencia si viene el rol: en un PATCH parcial que
    // solo cambie el nombre no hay nada que validar aqui.
    if (datos.rol) coherenciaAmbito(datos, ctx);
  });
