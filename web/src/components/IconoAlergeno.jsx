/**
 * Dibujo del alergeno, si lo hay.
 *
 * Nunca sustituye al nombre: el icono acompana al texto, no lo reemplaza.
 * Un cangrejo y una concha se confunden a simple vista, y esto es informacion
 * legal. Por eso alt="" (decorativo): el nombre ya va al lado y un lector de
 * pantalla no tiene que oirlo dos veces.
 *
 * Si el alergeno todavia no tiene imagen, devuelve null y queda la etiqueta
 * de texto de siempre. Faltar el dibujo nunca puede ocultar el alergeno.
 */
export default function IconoAlergeno({ alergeno, tamano = 22 }) {
  if (!alergeno?.icono) return null;

  return (
    <img
      className="alergeno__icono"
      src={`/alergenos/${alergeno.icono}`}
      alt=""
      width={tamano}
      height={tamano}
      loading="lazy"
      decoding="async"
    />
  );
}
