import { z } from 'zod';

/**
 * Direccion a la que apunta el boton de reservar de un local.
 *
 * La comprobacion del protocolo NO es cosmetica. Este valor lo escribe una
 * persona en el panel y acaba dentro de un href que pulsa cualquier visitante:
 * con `javascript:...` ahi, un encargado (o alguien que le robe la sesion)
 * ejecuta codigo en el navegador de todos los clientes del local. Por eso se
 * admite solo http y https, y en lista blanca: prohibir `javascript:` a mano
 * deja fuera `data:`, `vbscript:` y los que vengan manana.
 *
 * Se valida aqui y no solo al pintarlo porque el que guarda es el servidor:
 * lo que no entra, no puede salir.
 */
const PROTOCOLOS = new Set(['http:', 'https:']);

export const urlReservas = z
  .union([z.string().trim().max(500), z.literal(''), z.null()])
  .transform((v) => (v === '' || v === null ? null : v))
  .nullable()
  .refine(
    (v) => {
      if (v === null) return true;
      try {
        return PROTOCOLOS.has(new URL(v).protocol);
      } catch {
        return false;
      }
    },
    { message: 'Tiene que ser una direccion completa que empiece por https://' }
  );

const booleano = z
  .union([z.boolean(), z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')])
  .transform((v) => v === true || v === '1' || v === 'true');

// Un campo que se puede dejar en blanco. Vacio y NULL son lo mismo aqui: un
// telefono que no esta es NULL, no la cadena "", porque la ficha decide si
// ensena la fila mirando si el dato existe.
const opcional = (max) =>
  z
    .union([z.string().trim().max(max), z.literal(''), z.null()])
    .transform((v) => (v === '' || v === null ? null : v))
    .nullable();

// Los maximos salen de las columnas: nombre 120, municipio 80, direccion 200,
// telefono y whatsapp 20, email 120, reclamo 180. Cortar aqui da un error que
// se lee; dejarlo pasar da un error de MySQL a mitad del UPDATE.
const coordenada = (limite) =>
  z
    .union([z.coerce.number().min(-limite).max(limite), z.literal(''), z.null()])
    .transform((v) => (v === '' || v === null ? null : v))
    .nullable();

/**
 * Lo que se puede cambiar de un local desde el panel.
 *
 * NO esta el slug, y es a proposito: va en la direccion de su ficha, de su
 * carta y de los codigos QR que hay impresos y pegados en las mesas.
 * Cambiarlo desde un formulario dejaria esos QR apuntando a una pagina que ya
 * no existe, y eso no se arregla desde el panel.
 *
 * Tampoco la portada, que tiene su propio sitio porque es una subida de
 * fichero con recorte.
 */
export const actualizarLocalSchema = z
  .object({
    nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(120).optional(),
    municipio: z.string().trim().min(2, 'El municipio es obligatorio').max(80).optional(),
    direccion: z.string().trim().min(3, 'La direccion es obligatoria').max(200).optional(),
    telefono: opcional(20).optional(),
    whatsapp: opcional(20).optional(),
    email: z
      .union([z.string().trim().email('Ese correo no parece valido').max(120), z.literal(''), z.null()])
      .transform((v) => (v === '' || v === null ? null : v))
      .nullable()
      .optional(),
    reclamo: opcional(180).optional(),
    lat: coordenada(90).optional(),
    lng: coordenada(180).optional(),
    tiene_parking: booleano.optional(),
    url_reservas: urlReservas.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'No hay ningun cambio que aplicar',
  })
  // Media coordenada no sirve para nada: el boton "Como llegar" solo usa
  // lat/lng si estan las dos, y con una sola se cae al respaldo por nombre
  // sin que nadie se entere de que la otra falta.
  .refine((d) => (d.lat === undefined) === (d.lng === undefined), {
    message: 'La latitud y la longitud se guardan juntas',
    path: ['lat'],
  })
  .refine((d) => d.lat === undefined || (d.lat === null) === (d.lng === null), {
    message: 'O se ponen las dos coordenadas o se quitan las dos',
    path: ['lat'],
  });

/**
 * Los siete dias de la semana, de una vez.
 *
 * Se manda la semana entera y no un dia suelto: asi no puede quedar un local
 * a medio guardar -tres dias nuevos y cuatro viejos- si algo falla por el
 * camino.
 *
 * dia_semana sigue el convenio del esquema y de Date.getDay(): 0 es domingo.
 */
const hora = z
  .string()
  .trim()
  .regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'La hora se escribe como 12:30');

export const horariosSchema = z.object({
  horarios: z
    .array(
      z
        .object({
          dia_semana: z.coerce.number().int().min(0).max(6),
          cerrado: booleano.optional().default(false),
          hora_apertura: z.union([hora, z.literal(''), z.null()]).transform((v) => v || null).nullable(),
          hora_cierre: z.union([hora, z.literal(''), z.null()]).transform((v) => v || null).nullable(),
        })
        // Abierto quiere decir que hay horas. Un dia abierto sin horas deja la
        // ficha diciendo "abierto" y sin decir desde cuando, y las reservas
        // sin tramos que ofrecer.
        .refine((d) => d.cerrado || (d.hora_apertura && d.hora_cierre), {
          message: 'Un dia abierto necesita hora de apertura y de cierre',
          path: ['hora_apertura'],
        })
    )
    .length(7, 'Tienen que venir los siete dias'),
})
  .refine((d) => new Set(d.horarios.map((h) => h.dia_semana)).size === 7, {
    message: 'Hay algun dia repetido o alguno que falta',
    path: ['horarios'],
  });
