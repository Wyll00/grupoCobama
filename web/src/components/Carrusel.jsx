import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carrusel de fotos que pasa solo.
 *
 * Se mueve con el scroll horizontal nativo y scroll-snap, no con transform y
 * cuentas de pixeles. Asi el arrastre con el dedo, la rueda y el teclado
 * funcionan sin escribir nada, que es justo donde fallan los carruseles
 * hechos a mano.
 *
 * Lo importante de uno que pasa solo es poder pararlo. Una foto que se va
 * justo cuando la estabas mirando es de las cosas que mas irritan de una web,
 * asi que se detiene al pasar el raton, al llegar el foco con el teclado, al
 * tocarlo, y mientras la pestana no se ve. Y con el sistema puesto en "menos
 * animaciones" no arranca siquiera: ahi el usuario ya ha dicho que no quiere.
 */
const ESPERA_MS = 4500;

export default function Carrusel({ fotos, onAbrir }) {
  const pista = useRef(null);
  const [parado, setParado] = useState(false);

  const mover = useCallback((direccion) => {
    const nodo = pista.current;
    if (!nodo) return;

    // El ancho de la tarjeta se mide, no se supone: cambia con el tamano de
    // la pantalla y con el gap, y una constante aqui se descuadra sola.
    const tarjeta = nodo.querySelector('.carrusel__foto');
    const paso = tarjeta ? tarjeta.getBoundingClientRect().width + 16 : nodo.clientWidth * 0.8;

    const finDeCarrera = nodo.scrollLeft + nodo.clientWidth >= nodo.scrollWidth - 4;

    if (direccion > 0 && finDeCarrera) {
      nodo.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direccion < 0 && nodo.scrollLeft <= 4) {
      nodo.scrollTo({ left: nodo.scrollWidth, behavior: 'smooth' });
    } else {
      nodo.scrollBy({ left: paso * direccion, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (parado || fotos.length < 2) return;

    const menosAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (menosAnimacion.matches) return;

    const reloj = setInterval(() => {
      // Con la pestana de fondo los temporizadores se acumulan y al volver el
      // carrusel pega un salto de varias fotos de golpe.
      if (document.visibilityState !== 'visible') return;
      mover(1);
    }, ESPERA_MS);

    return () => clearInterval(reloj);
  }, [parado, fotos.length, mover]);

  if (fotos.length === 0) return null;

  return (
    <div
      className="carrusel"
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
      onFocusCapture={() => setParado(true)}
      onBlurCapture={() => setParado(false)}
      onTouchStart={() => setParado(true)}
    >
      {fotos.length > 1 && (
        <div className="carrusel__mandos">
          <button type="button" onClick={() => mover(-1)} aria-label="Fotos anteriores">
            ‹
          </button>
          <button type="button" onClick={() => mover(1)} aria-label="Fotos siguientes">
            ›
          </button>
        </div>
      )}

      <ul className="carrusel__pista" ref={pista}>
        {fotos.map((foto, i) => (
          <li key={foto.id}>
            <button
              type="button"
              className="carrusel__foto"
              onClick={() => onAbrir?.(i)}
              aria-label={`Ampliar: ${foto.alt ?? foto.titulo ?? 'foto'}`}
            >
              <img
                src={foto.imagen_thumb}
                alt={foto.alt ?? ''}
                width={foto.ancho}
                height={foto.alto}
                loading="lazy"
                decoding="async"
              />
              <span className="carrusel__pie">
                {foto.titulo && <strong>{foto.titulo}</strong>}
                {foto.restaurante_nombre && (
                  <span className="carrusel__local">{foto.restaurante_nombre}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
