import { z } from 'zod';

const booleano = z.union([z.boolean(), z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')])
  .transform((v) => v === true || v === '1' || v === 'true');

const textoOpcional = (max) =>
  z
    .string()
    .max(max)
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

// ------------------------------------------------------------------ platos

export const crearPlatoSchema = z.object({
  categoria_id: z.coerce.number().int().positive('Elige una categoria'),
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(150),
  nombre_en: textoOpcional(150),
  descripcion: textoOpcional(2000),
  descripcion_en: textoOpcional(2000),
  es_vegetariano: booleano.optional().default(false),
  es_vegano: booleano.optional().default(false),
  activo: booleano.optional().default(true),
  alergenos: z.array(z.coerce.number().int().positive()).max(14).optional(),
});

export const actualizarPlatoSchema = crearPlatoSchema
  .partial()
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'No hay ningun cambio que aplicar',
  });

export const listarPlatosSchema = z.object({
  categoria: z.string().trim().max(60).optional(),
  q: z.string().trim().max(120).optional(),
  activo: z.enum(['1', '0', 'todos']).optional().default('todos'),
  pagina: z.coerce.number().int().min(1).optional().default(1),
  porPagina: z.coerce.number().int().min(1).max(200).optional().default(50),
});

// ------------------------------------------------------------- carta_items

export const anadirACartaSchema = z.object({
  plato_id: z.coerce.number().int().positive(),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo').max(9999.99),
  destacado: booleano.optional().default(false),
  activo: booleano.optional().default(true),
});

export const actualizarCartaItemSchema = z
  .object({
    precio: z.coerce.number().min(0).max(9999.99).optional(),
    activo: booleano.optional(),
    destacado: booleano.optional(),
    orden: z.coerce.number().int().min(0).max(65535).optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'No hay ningun cambio que aplicar',
  });

export const reordenarSchema = z.object({
  orden: z
    .array(z.coerce.number().int().positive())
    .min(1, 'Manda al menos un elemento'),
});

/**
 * Alta de un plato que todavia no existe en el catalogo, directamente sobre la
 * carta de un local: los campos del plato mas el precio de esa carta.
 */
export const crearPlatoEnCartaSchema = crearPlatoSchema
  .omit({ activo: true })
  .extend({
    precio: z.coerce.number().min(0, 'El precio no puede ser negativo').max(9999.99),
    destacado: booleano.optional().default(false),
  });

// ------------------------------------------------------------- categorias

export const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(80),
  nombre_en: textoOpcional(80),
  orden: z.coerce.number().int().min(0).max(65535).optional(),
});

export const actualizarCategoriaSchema = z
  .object({
    nombre: z.string().trim().min(2).max(80).optional(),
    nombre_en: textoOpcional(80),
    orden: z.coerce.number().int().min(0).max(65535).optional(),
    activo: booleano.optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: 'No hay ningun cambio que aplicar',
  });

// --------------------------------------------------------------- imagenes

export const recorteSchema = z.object({
  x: z.coerce.number().int().min(0),
  y: z.coerce.number().int().min(0),
  ancho: z.coerce.number().int().positive(),
  alto: z.coerce.number().int().positive(),
});
