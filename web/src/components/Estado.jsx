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

  return (
    <div className="contenedor seccion">
      <div className="aviso">
        <strong>{ui('estado.error', idioma)}</strong>
        <br />
        {error?.message}
        <br />
        {/* La pista del puerto se queda en castellano: no la lee un cliente,
            la lee quien esta levantando el proyecto. Decia 4000, y el puerto
            por defecto de la API es 4100 -ver api/src/config/env.js-, asi que
            mandaba a mirar donde no hay nada. */}
        <span className="apagado">
          Comprueba que la API está levantada en el puerto 4100 (npm run dev --prefix api).
        </span>
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
