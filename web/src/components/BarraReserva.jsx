import { Link } from 'react-router-dom';
import { enlaceTelefono } from '../datos/grupo.js';

/**
 * Barra fija de reserva, solo en movil.
 *
 * La mayoria de las visitas de un restaurante llegan desde el movil, y la
 * decision se toma despues de leer la carta entera: para entonces el boton de
 * reservar de la cabecera queda a varias pantallas de distancia. Fija abajo,
 * la accion esta siempre a un pulgar.
 *
 * En escritorio no se pinta: alli los botones de la cabecera se ven sin
 * desplazarse y una barra flotante solo tapa contenido.
 */
export default function BarraReserva({ local }) {
  if (!local) return null;

  return (
    <div className="barra-reserva">
      <Link className="boton boton--principal barra-reserva__principal" to={`/reservar?local=${local.slug}`}>
        Reservar mesa
      </Link>

      {local.telefono && (
        <a
          className="boton boton--secundario barra-reserva__telefono"
          href={enlaceTelefono(local.telefono)}
          aria-label={`Llamar a ${local.nombre}`}
        >
          Llamar
        </a>
      )}
    </div>
  );
}
