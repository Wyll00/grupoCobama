import { Link } from 'react-router-dom';
import { EstadoApertura } from './Estado.jsx';
import { enlaceTelefono } from '../datos/grupo.js';

export default function TarjetaLocal({ local }) {
  return (
    <article className="tarjeta">
      <div className="tarjeta__cuerpo">
        <div className="tarjeta__titulo">
          <h3>
            <Link to={`/${local.slug}`} style={{ textDecoration: 'none' }}>
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
          persona ya ha decidido a cual quiere ir. El nombre de arriba sigue
          llevando a la ficha, asi que no hace falta un boton para eso.
        */}
        <div className="tarjeta__acciones">
          <Link className="boton boton--principal" to={`/reservar?local=${local.slug}`}>
            Reservar
          </Link>
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
