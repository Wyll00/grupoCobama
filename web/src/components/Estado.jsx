import { ui } from '../datos/idioma.js';
import { useIdioma } from '../hooks/useIdioma.js';

export function Cargando({ texto }) {
  const [idioma] = useIdioma();

  return (
    <p className="cargando" role="status">
      {texto ?? ui('estado.cargando', idioma)}
    </p>
  );
}

export function Error({ error }) {
  const [idioma] = useIdioma();

  /*
    La pista del puerto solo sale cuando el fallo es DEL SERVIDOR.

    Antes salia siempre, y eso estaba bien mientras el unico error posible era
    "la API no responde". Con la tarjeta de socio dejo de estarlo: un cliente
    que teclea mal su codigo recibe un 404 -"Esa tarjeta no existe"- y debajo
    se le decia que levantara la API con npm. El mensaje de arriba ya le dice
    lo que ha pasado; el de abajo solo le confunde.

    Asi que: 4xx es cosa de quien mira -el codigo esta mal, el enlace esta
    viejo- y no lleva pista. Sin status -la peticion ni salio- o 5xx si, que
    ahi el que tiene que hacer algo es quien levanta el proyecto. Y se queda
    en castellano a proposito, porque esa linea no la lee un cliente.
  */
  const esDelServidor = !error?.status || error.status >= 500;

  return (
    <div className="contenedor seccion">
      <div className="aviso">
        <strong>{ui('estado.error', idioma)}</strong>
        <br />
        {error?.message}
        {esDelServidor && (
          <>
            <br />
            <span className="apagado">
              Comprueba que la API está levantada en el puerto 4100 (npm run dev --prefix api).
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function EstadoApertura({ abierto }) {
  const [idioma] = useIdioma();

  return (
    <span className={`estado ${abierto ? 'estado--abierto' : 'estado--cerrado'}`}>
      {ui(abierto ? 'ficha.abierto' : 'ficha.cerrado', idioma)}
    </span>
  );
}
