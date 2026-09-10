import { useEffect, useId, useRef, useState } from 'react';
import { useIdioma } from '../hooks/useIdioma.js';

/**
 * Selector de idioma de la web.
 *
 * Vive en la cabecera, no en la carta. Estaba solo en la carta y por eso al
 * elegir ingles el resto de la web -la navegacion, la ficha del local, el
 * formulario de reservas- se quedaba en castellano: quien entraba por la
 * portada no tenia siquiera donde cambiarlo. La interfaz esta traducida
 * entera a los tres idiomas, asi que aqui salen los tres siempre.
 *
 * Lo que NO esta traducido entero son las cartas, y eso se resuelve donde
 * ocurre: la carta avisa cuando la suya no esta en el idioma elegido y la
 * sirve en castellano, en vez de mezclar los dos sin decir nada.
 *
 * ES UN DESPLEGABLE, no tres banderas en fila. En fila ocupaba el ancho de
 * tres botones en una cabecera que ya lleva cinco enlaces y el interruptor de
 * tema; en el movil eso empujaba la navegacion a una segunda linea. Asi ocupa
 * uno y ademas se lee mejor: se ve en que idioma estas, que es lo que se mira
 * primero, y las otras dos opciones aparecen solo cuando se van a usar.
 *
 * Las banderas van DIBUJADAS y no como emoji. Windows no pinta los emoji de
 * bandera: se ven como las letras "ES", "GB" y "DE", asi que en la mitad de
 * los escritorios no habria ninguna bandera.
 *
 * Ojo, que es una decision con coste: una bandera es un pais, no un idioma. La
 * del Reino Unido para "ingles" deja fuera a media Europa que lo lee, y para
 * el aleman estan Austria y Suiza. Se eligio bandera a sabiendas; por eso al
 * lado va siempre el codigo escrito, que es lo que de verdad lo identifica.
 */

function BanderaEspana() {
  return (
    <svg viewBox="0 0 60 30" className="idioma__bandera" aria-hidden="true" focusable="false">
      <rect width="60" height="30" fill="#aa151b" />
      <rect y="7.5" width="60" height="15" fill="#f1bf00" />
    </svg>
  );
}

function BanderaReinoUnido() {
  return (
    <svg viewBox="0 0 60 30" className="idioma__bandera" aria-hidden="true" focusable="false">
      <rect width="60" height="30" fill="#012169" />
      {/* Las aspas blancas y luego las rojas encima, mas finas: es el orden
          en el que se construye la union, y al reves salen las rojas
          partidas. */}
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#c8102e" strokeWidth="3" />
      <path d="M30 0 v30 M0 15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0 v30 M0 15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}

function BanderaAlemania() {
  return (
    <svg viewBox="0 0 60 30" className="idioma__bandera" aria-hidden="true" focusable="false">
      <rect width="60" height="10" fill="#000" />
      <rect y="10" width="60" height="10" fill="#dd0000" />
      <rect y="20" width="60" height="10" fill="#ffce00" />
    </svg>
  );
}

function Flecha() {
  return (
    <svg
      className="idiomas__flecha"
      viewBox="0 0 12 8"
      width="10"
      height="7"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 1.5 L6 6.5 L11 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const BANDERAS = [
  { codigo: 'es', nombre: 'Español', Bandera: BanderaEspana },
  { codigo: 'en', nombre: 'English', Bandera: BanderaReinoUnido },
  { codigo: 'de', nombre: 'Deutsch', Bandera: BanderaAlemania },
];

export default function Idiomas({ disponibles }) {
  const [idioma, cambiar] = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  const boton = useRef(null);
  const lista = useRef(null);
  const idLista = useId();

  /*
    Sin `disponibles` salen los tres, que es el caso de la cabecera: la
    interfaz esta traducida entera y no hay nada que esconder.

    El filtro se queda por si algun dia hace falta recortar la lista en una
    pantalla concreta. Con una sola opcion no se ensena nada: un desplegable
    de un elemento no es un desplegable, es un adorno que ocupa sitio.
  */
  const opciones = disponibles
    ? BANDERAS.filter((b) => disponibles.includes(b.codigo))
    : BANDERAS;

  const indice = Math.max(0, opciones.findIndex((b) => b.codigo === idioma));
  const actual = opciones[indice];

  /*
    Cerrar al pulsar fuera y al perder el foco.

    Va en `pointerdown` y no en `click`: si se escucha el click, pulsar un
    enlace de la navegacion con el menu abierto dispara antes la navegacion
    que el cierre, y el menu se queda pintado encima de la pagina nueva.
  */
  useEffect(() => {
    if (!abierto) return undefined;

    const fuera = (e) => {
      if (!caja.current?.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  // Al abrir, el foco va a la opcion puesta: quien navega con teclado empieza
  // donde esta, no en la primera de la lista.
  useEffect(() => {
    if (!abierto) return;
    lista.current?.querySelectorAll('[role="option"]')[indice]?.focus();
  }, [abierto, indice]);

  const cerrarYVolver = () => {
    setAbierto(false);
    boton.current?.focus();
  };

  const elegir = (codigo) => {
    cambiar(codigo);
    cerrarYVolver();
  };

  /* Las teclas de un desplegable de toda la vida: abajo abre, escape cierra. */
  const teclasBoton = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setAbierto(true);
    }
  };

  const teclasLista = (e) => {
    const salto = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    let destino = null;

    if (salto) destino = (indice + salto + opciones.length) % opciones.length;
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = opciones.length - 1;
    else if (e.key === 'Escape' || e.key === 'Tab') {
      cerrarYVolver();
      return;
    } else return;

    e.preventDefault();
    // Moverse por la lista CAMBIA el idioma, como en un <select> nativo: se
    // ve el efecto de cada paso en vez de tener que confirmar a ciegas.
    cambiar(opciones[destino].codigo);
  };

  if (opciones.length < 2) return null;

  return (
    <div className="idiomas" ref={caja}>
      <button
        type="button"
        ref={boton}
        className="idiomas__actual"
        // haspopup + expanded + controls: es lo que hace que un lector de
        // pantalla lo anuncie como un desplegable y diga si esta abierto.
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-label={`Idioma: ${actual.nombre}`}
        onClick={() => setAbierto((v) => !v)}
        onKeyDown={teclasBoton}
      >
        <actual.Bandera />
        <span className="idioma__codigo">{actual.codigo.toUpperCase()}</span>
        <Flecha />
      </button>

      {abierto && (
        <ul
          className="idiomas__menu"
          id={idLista}
          ref={lista}
          role="listbox"
          aria-label="Idioma de la web"
          onKeyDown={teclasLista}
        >
          {opciones.map(({ codigo, nombre, Bandera }, i) => {
            const puesto = i === indice;
            return (
              <li key={codigo}>
                <button
                  type="button"
                  className={`idiomas__opcion ${puesto ? 'idiomas__opcion--puesta' : ''}`}
                  lang={codigo}
                  role="option"
                  aria-selected={puesto}
                  tabIndex={puesto ? 0 : -1}
                  onClick={() => elegir(codigo)}
                >
                  <Bandera />
                  <span className="idiomas__nombre">{nombre}</span>
                  <span className="idioma__codigo">{codigo.toUpperCase()}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
