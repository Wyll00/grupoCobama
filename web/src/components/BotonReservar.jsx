import { Link } from 'react-router-dom';

/**
 * Boton de reservar de un local.
 *
 * Cada casa decide adonde lleva: si tiene `url_reservas`, ahi fuera (su widget
 * de CoverManager, TheFork, lo que sea); si no, al formulario de aqui.
 *
 * Vive en un componente y no repetido en cada pantalla porque hay cuatro
 * sitios con este boton (portada, tarjeta de local, ficha y barra de movil).
 * Repartida, la decision se olvida en uno de ellos y ese boton sigue llevando
 * al formulario cuando ya no debe: el cliente reserva por un sitio que el
 * local ha dejado de mirar.
 */
export default function BotonReservar({ local, className = 'boton boton--principal', children }) {
  const texto = children ?? 'Reservar mesa';
  const externa = local?.url_reservas;

  if (externa) {
    return (
      <a
        className={className}
        href={externa}
        // En pestana nueva: la carta se queda abierta detras. Si al cliente no
        // le convence la hora que le ofrecen, vuelve y sigue mirando en vez de
        // haberse ido del sitio.
        target="_blank"
        // noopener no es opcional con target=_blank: sin el, la pagina de
        // destino puede redirigir la nuestra desde window.opener.
        rel="noopener noreferrer"
      >
        {texto}
      </a>
    );
  }

  return (
    <Link className={className} to={local ? `/reservar?local=${local.slug}` : '/reservar'}>
      {texto}
    </Link>
  );
}
