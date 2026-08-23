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
 *
 * Recibe los <li> ya hechos en vez de una lista de fotos: lo que aporta este
 * componente es el movimiento y la pausa, no saber que hay dentro. Asi la
 * galeria y las recomendaciones del local usan el mismo, y arreglar la pausa
 * una vez la arregla en los dos sitios.
 */
const ESPERA_MS = 4500;

export default function Carrusel({
  children,
  total = 0,
  className = '',
  // La cabecera de la seccion (titulo, entradilla y su boton) se pasa aqui
  // en vez de pintarla fuera: las flechas van arriba a la derecha, o sea en
  // esa misma fila, y si no comparten contenedor hay que colocarlas con un
  // desplazamiento negativo a ojo. Eso solo cuadra mientras la cabecera mida
  // exactamente lo que medía el dia que se ajusto.
  cabecera = null,
  // Las flechas tienen que decir de que van: "siguientes" a secas no le dice
  // nada a quien navega con lector de pantalla.
  queSon = 'elementos',
}) {
  const pista = useRef(null);
  const [parado, setParado] = useState(false);

  const mover = useCallback((direccion) => {
    const nodo = pista.current;
    if (!nodo) return;

    // El ancho de la tarjeta se mide, no se supone: cambia con el tamano de
    // la pantalla y con el gap, y una constante aqui se descuadra sola. Se
    // mide el <li>, que existe en los dos usos, y no una clase concreta.
    const tarjeta = nodo.querySelector('li');
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
    if (parado || total < 2) return;

    const menosAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (menosAnimacion.matches) return;

    const reloj = setInterval(() => {
      // Con la pestana de fondo los temporizadores se acumulan y al volver el
      // carrusel pega un salto de varias fotos de golpe.
      if (document.visibilityState !== 'visible') return;
      mover(1);
    }, ESPERA_MS);

    return () => clearInterval(reloj);
  }, [parado, total, mover]);

  if (total === 0) return null;

  return (
    <div
      className={`carrusel ${className}`}
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
      onFocusCapture={() => setParado(true)}
      onBlurCapture={() => setParado(false)}
      onTouchStart={() => setParado(true)}
    >
      {(cabecera || total > 1) && (
        <div className="seccion__cabecera">
          {cabecera}
          {total > 1 && (
            <div className="carrusel__mandos">
              <button type="button" onClick={() => mover(-1)} aria-label={`Ver ${queSon} anteriores`}>
                ‹
              </button>
              <button type="button" onClick={() => mover(1)} aria-label={`Ver ${queSon} siguientes`}>
                ›
              </button>
            </div>
          )}
        </div>
      )}

      <ul className="carrusel__pista" ref={pista}>
        {children}
      </ul>
    </div>
  );
}
