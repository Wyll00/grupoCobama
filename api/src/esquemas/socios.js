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

/**
 * El alta que se hace uno mismo desde la web.
 *
 * Se parece a `crearSocioSchema` pero NO es el mismo, y conviene que sigan
 * separados aunque hoy casi coincidan:
 *
 *   - Aqui hace falta una forma de contacto. En sala no: el encargado tiene
 *     al cliente delante y le da la tarjeta en la mano. Por la web, una
 *     tarjeta sin telefono ni correo es irrecuperable en cuanto se pierda el
 *     movil, y el grupo no tiene forma de avisar del premio.
 *   - Aqui hay que confirmar que se enseno la politica. En sala el alta la
 *     hace un empleado y la conversacion es otra.
 *   - Aqui NO se admite `restaurante_id`: lo pondria quien quisiera, y el
 *     dato de "donde se dio de alta" dejaria de significar nada. Un alta por
 *     la web se marca como tal y punto.
 */
export const altaPublicaSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre').max(120),
    telefono: textoOpcional(30),
    email: z
      .union([z.email('Ese correo no parece valido').max(150), z.literal(''), z.null()])
      .optional()
      .transform((v) => (v === '' ? null : (v ?? null))),

    // La version se guarda para saber QUE texto se enseno. Vacia significa
    // que no se marco la casilla, y entonces no hay alta.
    politica_version: z
      .string()
      .trim()
      .min(1, 'Hay que confirmar que has leido la politica de privacidad')
      .max(20),

    marketing: z.coerce.boolean().optional().default(false),
  })
  .refine((d) => d.telefono || d.email, {
    message: 'Hace falta un teléfono o un correo para poder avisarte del premio',
    path: ['email'],
  });

export const buscarSociosSchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  // El panel agrupa por estado -con premio, a punto, sin estrenar, inactivos-
  // y eso lo hace sobre lo que ha recibido. Con el tope fijo en 25, decir
  // "3 inactivos" cuando hay 500 socios seria mentira. El techo de 200 esta
  // puesto porque cada fila cuesta tres consultas; ver socios.service.js.
  limite: z.coerce.number().int().positive().max(200).optional().default(25),
});
