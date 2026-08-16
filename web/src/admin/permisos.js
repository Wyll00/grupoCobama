/**
 * Quien puede tocar que, en una sola funcion.
 *
 * Es un espejo de lo que ya decide `ambitoPlato` en la API. El limite de
 * verdad esta en el servidor; esto solo sirve para no ensenar un boton que va
 * a responder 403.
 */

/**
 * Un encargado puede editar un plato si lo sirve unicamente su local, o si
 * todavia no lo sirve nadie. En cuanto lo pone otra casa, el plato pasa a ser
 * del grupo: renombrarlo se lo cambiaria a los demas.
 *
 * `plato` necesita traer `locales` y `unico_restaurante_id`, que vienen tanto
 * del listado como de la ficha.
 */
export function puedeEditarPlato(plato, { esAdmin, localFijo }) {
  if (esAdmin) return true;
  if (!plato) return false;
  if (plato.locales === 0) return true;
  return plato.locales === 1 && plato.unico_restaurante_id === localFijo;
}

/** Explica por que no se puede, para poder decirlo en pantalla. */
export function motivoNoEditable(plato, { esAdmin, localFijo }) {
  if (puedeEditarPlato(plato, { esAdmin, localFijo })) return null;
  if (plato.locales > 1) {
    return `Lo sirven ${plato.locales} locales, asi que lo mantiene la administracion del grupo.`;
  }
  return 'Este plato es de otro local.';
}
