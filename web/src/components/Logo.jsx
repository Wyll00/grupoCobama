/**
 * Logo del grupo: el sello 2a.
 *
 * Doble anillo con el monograma CB y el nombre debajo o al lado, segun donde
 * se use.
 *
 * En SVG y no con divs y border-radius como en el documento de marca. Un logo
 * se ve a 32 px en una pestana y a 200 px en una cabecera, y los bordes
 * redondeados de CSS se ven sucios al escalar. Ademas asi el mismo dibujo
 * vale de favicon.
 *
 * Los colores salen de `currentColor` y de una variable, para que el sello
 * funcione igual sobre la cabecera clara y sobre el pie oscuro sin duplicar
 * nada.
 */

/** Solo el sello, sin texto. Sirve de icono suelto y de favicon. */
export function Sello({ tamano = 44, className = '' }) {
  return (
    <svg
      className={`sello ${className}`}
      width={tamano}
      height={tamano}
      viewBox="0 0 104 104"
      // Decorativo: el nombre va escrito al lado en texto de verdad, asi que
      // un lector de pantalla que lea tambien el dibujo diria "Cobama" dos
      // veces.
      aria-hidden="true"
      focusable="false"
    >
      {/* Los grosores van en unidades del viewBox (104), asi que se dividen
          por 104/tamano al pintarse. Con los 2 y 1 del documento de marca, a
          los 44 px de la cabecera quedaban en 0,85 y 0,42 px reales: el
          anillo interior desaparecia en pantallas normales. Subidos para que
          a tamano de cabecera den ~1,7 y ~0,9 px, que es lo que se ve. */}
      <circle cx="52" cy="52" r="50" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle
        cx="52"
        cy="52"
        r="42"
        fill="none"
        stroke="var(--sello-anillo, currentColor)"
        strokeWidth="2.2"
      />
      <text
        x="52"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontFamily="var(--fuente-titulo)"
        fontSize="31"
        letterSpacing="1.2"
        // El text-anchor centra la caja del texto, pero el letter-spacing
        // anade un hueco despues de la ultima letra que no se compensa solo:
        // sin esto, CB queda pegado a la izquierda del circulo.
        dx="0.6"
      >
        CB
      </text>
    </svg>
  );
}

/**
 * Sello + nombre. `orientacion` decide si van en fila (cabecera) o apilados.
 */
export default function Logo({
  tamano = 44,
  orientacion = 'fila',
  descriptor = null,
  className = '',
}) {
  return (
    <span className={`logo logo--${orientacion} ${className}`}>
      <Sello tamano={tamano} />
      <span className="logo__texto">
        <span className="logo__nombre">Cobama</span>
        {descriptor && <span className="logo__descriptor">{descriptor}</span>}
      </span>
    </span>
  );
}
