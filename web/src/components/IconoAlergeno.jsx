/**
 * Dibujo del alergeno, si lo hay.
 *
 * `nombre` decide si el dibujo va SOLO o acompanando a un texto.
 *
 * Sin nombre es decorativo (alt=""): al lado hay una etiqueta escrita y un
 * lector de pantalla no tiene que oir lo mismo dos veces.
 *
 * Con nombre, el dibujo es la unica forma de saber de que alergeno se trata,
 * asi que lleva el nombre en el alt -para quien no ve la pantalla- y en el
 * title -para quien no reconoce el dibujo y pasa el raton por encima-. Un
 * cangrejo y una concha se parecen bastante, y esto es informacion legal: no
 * puede quedarse solo en el dibujo.
 *
 * Si el alergeno todavia no tiene imagen devuelve null, y quien lo llama tiene
 * que enseniar el nombre escrito. Faltar el dibujo nunca puede ocultar el
 * alergeno.
 */
export default function IconoAlergeno({ alergeno, tamano = 22, nombre = null }) {
  if (!alergeno?.icono) return null;

  return (
    <img
      className="alergeno__icono"
      src={`/alergenos/${alergeno.icono}`}
      alt={nombre ?? ''}
      title={nombre ?? undefined}
      width={tamano}
      height={tamano}
      loading="lazy"
      decoding="async"
    />
  );
}
