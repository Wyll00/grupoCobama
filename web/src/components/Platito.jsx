import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * Interruptor de modo oscuro con forma de plato.
 *
 * De dia el plato esta entero; de noche le entra una sombra por un lado y se
 * queda en cuarto creciente. Es la misma idea de las fases de la luna, pero
 * con la vajilla, que es de lo que va la casa.
 *
 * El tema NO se decide aqui. Lo pone un script en index.html antes del primer
 * pintado; este componente solo lo lee y lo cambia. Si lo decidiera React, al
 * cargar se veria un fogonazo blanco hasta que monta el componente, y una
 * carta que alguien abre de noche en la mesa es justo donde eso molesta.
 */
const CLAVE = 'cobama-tema';

function temaActual() {
  if (typeof document === 'undefined') return 'claro';
  return document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
}

export default function Platito() {
  const [tema, setTema] = useState(temaActual);
  const boton = useRef(null);

  // Si el usuario no ha elegido nunca, la web sigue al sistema: cambiar el
  // movil a modo noche tiene que cambiar la carta sin tocar nada. En cuanto
  // elige, manda su eleccion y esto deja de escuchar.
  useEffect(() => {
    const consulta = window.matchMedia('(prefers-color-scheme: dark)');
    const alCambiar = (e) => {
      if (localStorage.getItem(CLAVE)) return;
      const nuevo = e.matches ? 'oscuro' : 'claro';
      document.documentElement.dataset.tema = nuevo;
      setTema(nuevo);
    };
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  const alternar = () => {
    // Se lee del DOM y no del estado de React. setTema no es inmediato: dos
    // pulsaciones seguidas leerian las dos el mismo valor viejo y harian lo
    // mismo dos veces, asi que el segundo clic no deshacia el primero.
    // El atributo del <html> ya es la fuente de verdad (lo pone el script de
    // index.html antes de que React exista), asi que preguntarle a el es
    // ademas lo coherente.
    const actual = document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
    const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro';

    const aplicar = () => {
      document.documentElement.dataset.tema = nuevo;
      try {
        localStorage.setItem(CLAVE, nuevo);
      } catch {
        // Navegacion privada con el almacenamiento capado: el cambio funciona
        // igual, solo que no se recuerda al recargar. No es motivo para que
        // reviente el boton.
      }
      // flushSync obliga a React a repintar el plato DENTRO de la transicion.
      // Sin esto cambiaria de fase despues del barrido, y se nota.
      flushSync(() => setTema(nuevo));
    };

    const pocaAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || pocaAnimacion) {
      aplicar();
      return;
    }

    // El circulo nace en el centro del boton y crece hasta tapar la esquina mas
    // lejana. Por eso el radio se calcula a la esquina opuesta y no es un numero
    // fijo: en un movil apaisado uno fijo se quedaria corto y se veria el corte.
    const caja = boton.current?.getBoundingClientRect();
    const x = caja ? caja.left + caja.width / 2 : window.innerWidth / 2;
    const y = caja ? caja.top + caja.height / 2 : 0;
    const radio = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transicion = document.startViewTransition(aplicar);
    transicion.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radio}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 480,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            // Se anima la capa NUEVA: el tema entrante se descubre por encima
            // del saliente, que es lo que da la sensacion de barrido.
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch(() => {
        // Si el navegador aborta la transicion (otra pulsacion encima) el tema
        // ya se aplico igualmente. No hay nada que rescatar.
      });
  };

  const esOscuro = tema === 'oscuro';

  return (
    <button
      type="button"
      className="platito"
      onClick={alternar}
      // aria-pressed y no un switch: es un boton que enciende algo, y asi el
      // lector de pantalla dice tambien si esta activado o no.
      aria-pressed={esOscuro}
      aria-label={esOscuro ? 'Volver al modo claro' : 'Cambiar a modo oscuro'}
      title={esOscuro ? 'Modo claro' : 'Modo oscuro'}
    >
      <svg viewBox="0 0 44 44" width="26" height="26" aria-hidden="true" focusable="false">
        {/* La loza */}
        <circle cx="22" cy="22" r="16" className="platito__loza" />

        {/* La sombra. En claro se aparta del plato y no se ve; en oscuro
            entra y lo deja en creciente. Va pintada del color del fondo de
            la pagina, asi que recorta en vez de manchar. */}
        <circle cx="22" cy="22" r="15.2" className="platito__sombra" />

        {/* El ala del plato, encima de la sombra a proposito: asi el borde
            no se parte y se sigue leyendo como plato y no como luna. */}
        <circle cx="22" cy="22" r="9.5" className="platito__ala" />
        <circle cx="22" cy="22" r="16" className="platito__canto" />
      </svg>
    </button>
  );
}
