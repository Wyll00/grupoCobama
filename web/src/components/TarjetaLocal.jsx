import { Link } from 'react-router-dom';
import BotonReservar from './BotonReservar.jsx';
import { EstadoApertura } from './Estado.jsx';
import { enlaceTelefono } from '../datos/grupo.js';

export default function TarjetaLocal({ local }) {
  return (
    <article className="tarjeta">
      <div className="tarjeta__cuerpo">
        <div className="tarjeta__titulo">
          <h3>
            {/*
              Este enlace se estira por encima de toda la tarjeta (ver
              .tarjeta__enlace::after), asi que pulsar en cualquier parte
              lleva a la ficha del local.

              Envolver la tarjeta entera en un <a> seria lo primero que se le
              ocurre a uno, pero dentro hay tres botones y meter enlaces
              dentro de un enlace es HTML invalido: el navegador lo desanida
              solo y el teclado deja de funcionar como debe. Con la capa
              estirada hay UN solo enlace en el arbol de accesibilidad, el del
              nombre, que es ademas el que describe adonde va.
            */}
            <Link className="tarjeta__enlace" to={`/${local.slug}`}>
              {local.nombre}
            </Link>
          </h3>
          <span className="tarjeta__municipio">{local.municipio}</span>
        </div>

        <EstadoApertura abierto={local.abierto_ahora} />

        <p className="apagado" style={{ marginTop: '0.75rem' }}>
          {local.reclamo}
        </p>

        <p className="apagado" style={{ fontSize: '0.875rem' }}>
          {local.direccion}
          {local.tiene_parking && ' · Parking propio'}
        </p>

        {/*
          Reservar va primero y con el local ya elegido: desde la tarjeta, la
          persona ya ha decidido a cual quiere ir. Para ir a la ficha basta
          con pulsar la tarjeta, asi que no hace falta un boton para eso.
        */}
        <div className="tarjeta__acciones">
          <BotonReservar local={local}>Reservar</BotonReservar>
          <Link className="boton boton--secundario" to={`/${local.slug}/carta`}>
            Ver la carta
          </Link>
          {local.telefono && (
            <a className="boton boton--secundario" href={enlaceTelefono(local.telefono)}>
              Llamar
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
