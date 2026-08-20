import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useMetadatos } from '../hooks/useMetadatos.js';
import { api } from '../api/client.js';
import { Cargando, Error, EstadoApertura } from '../components/Estado.jsx';
import BarraReserva from '../components/BarraReserva.jsx';
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
      {/*
        La foto va de fondo, atenuada y con degradado encima. La capa no es
        decorativa: sin ella el texto blanco sobre una foto clara se vuelve
        ilegible, y el contraste es lo primero que se pierde al meter imagenes
        en una cabecera.
      */}
      <section
        className={`ficha__cabecera ${local.imagen_portada ? 'ficha__cabecera--con-foto' : ''}`}
        style={
          local.imagen_portada
            ? { backgroundImage: `url(${local.imagen_portada})` }
            : undefined
        }
      >
        <div className="contenedor">
          <p className="tarjeta__municipio">{local.municipio}</p>
          <h1>{local.nombre}</h1>
          <EstadoApertura abierto={local.abierto_ahora} />
          <p style={{ marginTop: '1rem' }}>{local.descripcion}</p>

          {/*
            Reservar es la accion principal y lleva al formulario con este
            local ya elegido. Antes solo habia WhatsApp aqui, asi que desde la
            ficha de un local no habia forma de llegar al formulario.
            WhatsApp se queda como alternativa, que es como reserva mucha
            gente, pero deja de ser el unico camino.
          */}
          <div className="ficha__acciones">
            <Link className="boton boton--principal" to={`/reservar?local=${local.slug}`}>
              Reservar mesa
            </Link>
            <Link
              className="boton boton--secundario"
              style={{ borderColor: '#4a413a', color: 'var(--crema)' }}
              to={`/${local.slug}/carta`}
            >
              Ver la carta
            </Link>
            <a
              className="boton boton--secundario"
              style={{ borderColor: '#4a413a', color: 'var(--crema)' }}
              href={enlaceWhatsApp(`Hola, me gustaria reservar mesa en ${local.nombre}.`)}
            >
              WhatsApp
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

            {/* Misma tarjeta que el horario, para que las dos columnas pesen
                igual. El parking se marca como dato util, no como frase: en
                Tenerife decide si vas o no. */}
            <div className="sitio">
              <p className="sitio__direccion">{local.direccion}</p>

              <ul className="sitio__datos">
                <li className={local.tiene_parking ? 'sitio__dato--si' : 'sitio__dato--no'}>
                  {local.tiene_parking ? 'Parking propio' : 'Sin parking propio'}
                </li>
                <li className="sitio__dato--si">{local.municipio}</li>
              </ul>

              <a
                className="boton boton--principal sitio__llegar"
                href={enlaceMapa(local)}
                target="_blank"
                rel="noreferrer"
              >
                Como llegar
              </a>
            </div>
          </div>

          <div className="bloque-dato">
            <h3>Horario</h3>

            {/*
              El dia de hoy va marcado: quien mira un horario casi siempre
              quiere saber a que hora abren HOY, no leerse los siete dias.
              Lo decide la API en hora de Canarias, no el navegador.
            */}
            <ul className="horario">
              {local.horarios.map((tramo) => (
                <li
                  key={tramo.dias}
                  className={`horario__tramo ${tramo.es_hoy ? 'horario__tramo--hoy' : ''}`}
                >
                  <span className="horario__dias">
                    {tramo.dias}
                    {tramo.es_hoy && <span className="horario__hoy">hoy</span>}
                  </span>
                  <span className={`horario__horas ${tramo.cerrado ? 'horario__horas--cerrado' : ''}`}>
                    {tramo.horario}
                  </span>
                </li>
              ))}
            </ul>

            <p className="horario__pie">
              <EstadoApertura abierto={local.abierto_ahora} />
            </p>
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

      <BarraReserva local={local} />
    </>
  );
}
