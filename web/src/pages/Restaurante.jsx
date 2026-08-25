import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useMetadatos } from '../hooks/useMetadatos.js';
import { api } from '../api/client.js';
import BotonReservar from '../components/BotonReservar.jsx';
import Recomendados from '../components/Recomendados.jsx';
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
  // Aparte de la ficha y sin bloquearla: si el local no ha marcado ninguno,
  // la seccion no se pinta y la pagina sigue estando entera.
  const destacados = useApi((opts) => api.destacados(slug, opts), [slug]);

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
        className={[
          'ficha__cabecera',
          local.imagen_portada && 'ficha__cabecera--con-foto',
          // Lo decide la imagen, no una persona: al procesar la portada se
          // mide la franja central, que es donde cae el texto. Ver
          // estiloDelTexto en imagenes.service.js.
          local.portada_estilo === 'claro' && 'ficha__cabecera--clara',
        ]
          .filter(Boolean)
          .join(' ')}
        // Las dos imagenes van como variables CSS y no como backgroundImage
        // directo: un estilo en linea gana a cualquier regla de la hoja, asi
        // que con backgroundImage no habria forma de que una media query
        // eligiera la de movil.
        style={
          local.imagen_portada
            ? {
                '--portada': `url(${local.imagen_portada})`,
                '--portada-movil': `url(${local.imagen_portada_movil ?? local.imagen_portada})`,
              }
            : undefined
        }
      >
        <div className="contenedor">
          <p className="tarjeta__municipio">{local.municipio}</p>
          <h1>{local.nombre}</h1>
          {/* El "abierto/cerrado ahora" NO va aqui. Lo primero que ve alguien
              al abrir la ficha no puede ser un cartel de cerrado: corta el
              impulso justo donde estan Reservar y Ver la carta, y ademas es
              informacion de horario, que ya esta -y con la tabla entera al
              lado- mas abajo en su bloque. */}
          <p style={{ marginTop: '1rem' }}>{local.descripcion}</p>

          {/*
            Reservar es la accion principal y lleva al formulario con este
            local ya elegido. Antes solo habia WhatsApp aqui, asi que desde la
            ficha de un local no habia forma de llegar al formulario.
            WhatsApp se queda como alternativa, que es como reserva mucha
            gente, pero deja de ser el unico camino.
          */}
          <div className="ficha__acciones">
            <BotonReservar local={local} className="boton boton--principal ficha__accion--duplicada" />
            <Link
              className="boton boton--secundario"
              style={{ borderColor: '#4a413a', color: 'var(--crema)' }}
              to={`/${local.slug}/carta`}
            >
              Ver la carta
            </Link>
            <Link
              className="boton boton--secundario"
              style={{ borderColor: '#4a413a', color: 'var(--crema)' }}
              to={`/${local.slug}/galeria`}
            >
              Ver fotos
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
                className="boton boton--secundario ficha__accion--duplicada"
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

                {/*
                  Abierto o cerrado, al final de esta misma fila.

                  Estaba debajo de la tabla de horarios, que es donde uno lo
                  escribe pensando "va con los horarios". Pero quien quiere
                  saber si puede ir ahora no se pone a leer siete tramos: mira
                  los datos rapidos del local. Aqui esta con el parking y el
                  municipio, que son las otras dos cosas que se miran de un
                  vistazo.

                  Envuelto en el <li> en vez de llevar sus clases: asi la
                  pastilla la pinta la fila y el color del estado lo pinta el
                  <span>, sin que una regla le gane a la otra por
                  especificidad.
                */}
                <li className="sitio__ahora">
                  <EstadoApertura abierto={local.abierto_ahora} />
                </li>
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

          </div>
        </div>
      </section>

      <Recomendados local={local} platos={destacados.datos ?? []} />

      <BarraReserva local={local} />
    </>
  );
}
