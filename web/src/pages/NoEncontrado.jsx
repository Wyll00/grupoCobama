import { Link } from 'react-router-dom';
import { ui } from '../datos/idioma.js';
import { useIdioma } from '../hooks/useIdioma.js';

export default function NoEncontrado() {
  const [idioma] = useIdioma();

  return (
    <section className="seccion">
      <div className="contenedor" style={{ textAlign: 'center' }}>
        <h1>{ui('perdido.titulo', idioma)}</h1>
        <p className="apagado">{ui('perdido.texto', idioma)}</p>
        <Link className="boton boton--principal" to="/">
          {ui('perdido.volver', idioma)}
        </Link>
      </div>
    </section>
  );
}
