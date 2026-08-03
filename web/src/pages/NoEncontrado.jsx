import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <section className="seccion">
      <div className="contenedor" style={{ textAlign: 'center' }}>
        <h1>Esta pagina no existe</h1>
        <p className="apagado">Puede que el enlace este mal o que el local haya cambiado de nombre.</p>
        <Link className="boton boton--principal" to="/">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
