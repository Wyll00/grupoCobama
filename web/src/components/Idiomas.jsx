import { useIdioma } from '../hooks/useIdioma.js';

/**
 * Selector de idioma de la carta.
 *
 * Las banderas van DIBUJADAS y no como emoji. Windows no pinta los emoji de
 * bandera: se ven como las letras "ES", "GB" y "DE", asi que en la mitad de
 * los escritorios no habria ninguna bandera.
 *
 * Ojo, que es una decision con coste: una bandera es un pais, no un idioma. La
 * del Reino Unido para "ingles" deja fuera a media Europa que lo lee, y para
 * el aleman estan Austria y Suiza. Se eligio bandera a sabiendas; lo estandar
 * son las siglas, y cambiarlo es quitar el <svg> y dejar el codigo.
 *
 * Que hay traducido de verdad, para no prometer de mas: de 166 platos hay 70
 * con nombre en ingles y aleman, y 30 con descripcion. Lo que falte sale en
 * castellano, campo a campo -ver `texto()` en datos/idioma.js-. Un plato a
 * medias es mejor que un hueco en blanco, y muchisimo mejor en una carta con
 * alergenos.
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

const BANDERAS = [
  { codigo: 'es', nombre: 'Espanol', Bandera: BanderaEspana },
  { codigo: 'en', nombre: 'English', Bandera: BanderaReinoUnido },
  { codigo: 'de', nombre: 'Deutsch', Bandera: BanderaAlemania },
];

export default function Idiomas() {
  const [idioma, cambiar] = useIdioma();

  return (
    <div className="idiomas" role="group" aria-label="Idioma de la carta">
      {BANDERAS.map(({ codigo, nombre, Bandera }) => {
        const activo = idioma === codigo;
        return (
          <button
            key={codigo}
            type="button"
            className={`idioma ${activo ? 'idioma--activo' : ''}`}
            lang={codigo}
            onClick={() => cambiar(codigo)}
            // `aria-pressed` y no solo la clase: quien no ve la pantalla
            // necesita saber cual esta puesto, y el color no se lo dice.
            aria-pressed={activo}
            title={nombre}
          >
            <Bandera />
            <span className="idioma__codigo">{codigo.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
