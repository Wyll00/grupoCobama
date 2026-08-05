import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useMetadatos } from '../hooks/useMetadatos.js';
import { api } from '../api/client.js';
import { Cargando, Error, EstadoApertura } from '../components/Estado.jsx';
import { enlaceMapa, enlaceTelefono, enlaceWhatsApp } from '../datos/grupo.js';

const formatoPrecio = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export default function Restaurante() {
  const { slug } = useParams();
  const { datos: local, cargando, error } = useApi(
    (opts) => api.restaurante(slug, opts),
    [slug]
  );

  useMetadatos({
    titulo: local ? `${local.nombre} · ${local.municipio} · Grupo Cobama` : undefined,
    descripcion: local?.reclamo ?? undefined,
  });

  if (error) return <Error error={error} />;
  if (cargando) return <Cargando texto="Cargando el local..." />;

  return (
    <>
      <section className="ficha__cabecera">
        <div className="contenedor">
          <p className="tarjeta__municipio">{local.municipio}</p>
          <h1>{local.nombre}</h1>
          <EstadoApertura abierto={local.abierto_ahora} />
          <p style={{ marginTop: '1rem' }}>{local.descripcion}</p>

          <div className="ficha__acciones">
            <Link className="boton boton--principal" to={`/${local.slug}/carta`}>
              Ver la carta
            </Link>
            <a
              className="boton boton--secundario"
              style={{ borderColor: '#4a413a', color: 'var(--crema)' }}
              href={enlaceWhatsApp(`Hola, me gustaria reservar mesa en ${local.nombre}.`)}
            >
              Reservar por WhatsApp
            </a>
            {local.telefono && (
              <a
                className="boton boton--secundario"
                style={{ borderColor: '#4a413a', color: 'var(--crema)' }}
                href={enlaceTelefono(local.telefono)}
              >
                {local.telefono}
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor datos">
          <div className="bloque-dato">
            <h3>Donde estamos</h3>
            <p>{local.direccion}</p>
            <p className="apagado">
              {local.tiene_parking ? 'Con parking propio.' : 'Sin parking propio.'}
            </p>
            <a
              className="boton boton--secundario"
              href={enlaceMapa(local)}
              target="_blank"
              rel="noreferrer"
            >
              Como llegar
            </a>
          </div>

          <div className="bloque-dato">
            <h3>Horario</h3>
            <table className="tabla-horario">
              <tbody>
                {local.horarios.map((tramo) => (
                  <tr key={tramo.dias}>
                    <td>{tramo.dias}</td>
                    <td className={tramo.cerrado ? 'apagado' : undefined}>{tramo.horario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {local.menus_grupo.length > 0 && (
        <section className="seccion" style={{ paddingTop: 0 }}>
          <div className="contenedor">
            <h2>Menus para grupos</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {local.menus_grupo.map((menu) => (
                <li key={menu.id} className="plato">
                  <div className="plato__info">
                    <div className="plato__nombre">{menu.nombre}</div>
                    <p className="plato__descripcion">
                      {menu.descripcion} Minimo {menu.minimo_comensales} personas.
                    </p>
                  </div>
                  <div className="plato__precio">
                    {formatoPrecio.format(menu.precio_por_persona)}
                    <span className="apagado" style={{ fontSize: '0.75rem', display: 'block', textAlign: 'right' }}>
                      por persona
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
