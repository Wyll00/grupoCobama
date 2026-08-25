/**
 * Selector de idioma de la carta.
 *
 * TODAVIA NO TRADUCE. Los botones estan puestos y colocados, pero
 * deshabilitados a proposito: en la base hay nombre en ingles para 67 de los
 * 171 platos y para ninguna descripcion, y en aleman no hay absolutamente
 * nada. Una bandera que se pulsa y deja la carta en castellano es peor que no
 * tenerla: el cliente cree que la web esta rota.
 *
 * Deshabilitados y no escondidos porque asi se ve donde van a ir y se puede
 * ajustar el hueco ahora, sin tener que recolocar nada el dia que se
 * enciendan. Para encenderlos: quitar `disabled`, quitar `title` y colgar el
 * onClick del idioma.
 *
 * Las banderas van DIBUJADAS y no como emoji. Windows no pinta los emoji de
 * bandera: 🇬🇧 sale como las letras "GB" y 🇩🇪 como "DE", asi que en la mitad
 * de los escritorios no se veria ninguna bandera. Dibujadas se ven igual en
 * todos lados y escalan sin ensuciarse.
 *
 * Ojo el dia que se enciendan: una bandera es un pais, no un idioma. La del
 * Reino Unido para "ingles" deja fuera a media Europa que lo lee, y para el
 * aleman estan Austria y Suiza. Si un dia molesta, lo estandar es poner las
 * siglas EN / DE.
 */

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

const IDIOMAS = [
  { codigo: 'en', nombre: 'English', Bandera: BanderaReinoUnido },
  { codigo: 'de', nombre: 'Deutsch', Bandera: BanderaAlemania },
];

export default function Idiomas() {
  return (
    <div className="idiomas" role="group" aria-label="Idioma de la carta">
      {IDIOMAS.map(({ codigo, nombre, Bandera }) => (
        <button
          key={codigo}
          type="button"
          className="idioma"
          lang={codigo}
          disabled
          // El motivo va en el title Y en el aria-label: un boton
          // deshabilitado sin explicacion es una pared sin puerta.
          title={`${nombre}: todavia no disponible`}
          aria-label={`${nombre}: todavia no disponible`}
        >
          <Bandera />
          <span className="idioma__codigo">{codigo.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
