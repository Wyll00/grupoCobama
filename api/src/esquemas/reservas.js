import { z } from 'zod';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha tiene que ser AAAA-MM-DD');

// Se admite '20:30' y '20:30:00': el primero viene del <input type=time> y el
// segundo de la propia base de datos.
const hora = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'La hora no es valida')
  .transform((v) => v.slice(0, 5));

const textoOpcional = (max) =>
  z
    .string()
    .max(max)
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

export const crearReservaSchema = z.object({
  restaurante_id: z.coerce.number().int().positive('Elige un local'),
  nombre: z.string().trim().min(2, 'Pon un nombre para la reserva').max(120),
  // Sin validar formato de telefono: entre fijos, moviles, prefijos y numeros
  // extranjeros, una expresion regular estricta rechaza clientes de verdad.
  telefono: z.string().trim().min(6, 'Falta un telefono de contacto').max(30),
  email: z.union([z.email('El email no es valido').max(150), z.literal('')])
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  fecha,
  hora,
  comensales: z.coerce.number().int().min(1, 'Al menos una persona').max(50),
  observaciones: textoOpcional(500),
});

/** Alta desde el panel: ademas del origen, admite la nota interna. */
export const crearReservaManualSchema = crearReservaSchema.extend({
  origen: z.enum(['telefono', 'whatsapp', 'web']).optional().default('telefono'),
  notas_internas: textoOpcional(500),
});

export const actualizarReservaSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120).optional(),
    telefono: z.string().trim().min(6).max(30).optional(),
    email: z.union([z.email().max(150), z.literal('')])
      .transform((v) => (v === '' ? null : v))
      .nullable()
      .optional(),
    fecha: fecha.optional(),
    hora: hora.optional(),
    comensales: z.coerce.number().int().min(1).max(50).optional(),
    observaciones: textoOpcional(500),
    notas_internas: textoOpcional(500),
    estado: z.enum(['pendiente', 'confirmada', 'cancelada', 'no_presentado']).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay ningun cambio que aplicar' });

export const listarReservasSchema = z.object({
  desde: fecha.optional(),
  hasta: fecha.optional(),
  estado: z
    .enum(['pendiente', 'confirmada', 'cancelada', 'no_presentado', 'todas'])
    .optional()
    .default('todas'),
  q: z.string().trim().max(60).optional(),
});

export const tramosSchema = z.object({
  restaurante_id: z.coerce.number().int().positive(),
  fecha,
});
