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

export const actualizarLocalSchema = z
  .object({
    url_reservas: urlReservas.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'No hay ningun cambio que aplicar',
  });
