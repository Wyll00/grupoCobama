import { z } from 'zod';

export const CATEGORIAS = ['plato', 'local', 'equipo', 'evento'];

const textoOpcional = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

const booleano = z.union([z.boolean(), z.enum(['true', 'false', '1', '0'])]).transform((v) => v === true || v === 'true' || v === '1');

/**
 * Alta de foto. Los campos llegan como texto dentro del multipart, no como
 * JSON, asi que todo entra en cadena y hay que coaccionar.
 */
export const subirFotoSchema = z.object({
  categoria: z.enum(CATEGORIAS).optional().default('local'),
  titulo: textoOpcional(150),
  // La descripcion es lo que oye quien no ve la foto y lo que lee un
  // buscador. Es opcional aqui para no bloquear una subida de veinte fotos,
  // pero el panel marca las que faltan: sin ella, la foto no existe ni para
  // un lector de pantalla ni para Google Imagenes.
  alt: textoOpcional(255),
});

export const actualizarFotoSchema = z
  .object({
    categoria: z.enum(CATEGORIAS).optional(),
    titulo: textoOpcional(150),
    alt: textoOpcional(255),
    activo: booleano.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay ningun cambio que aplicar' });

export const reordenarGaleriaSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'Hace falta al menos una foto').max(300),
});

export const listarGaleriaSchema = z.object({
  categoria: z.enum(CATEGORIAS).optional(),
});
