import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import TarjetaLocal from '../components/TarjetaLocal.jsx';
import { Cargando, Error } from '../components/Estado.jsx';
import { GRUPO, enlaceWhatsApp } from '../datos/grupo.js';

/**
 * Reloj para el reclamo de cocina ininterrumpida.
 *
 * Dibujado y no un emoji: hereda el color del texto, se ve nitido a cualquier
 * tamano y no depende de como pinte los emoji cada sistema -en Windows el de
 * reloj sale azul, que aqui no pinta nada-.
 *
 * Las agujas marcan las cinco y algo: la hora a la que en la isla casi todas
 * las cocinas estan cerradas, que es de lo que va el cartel.
 */
function RelojAbierto() {
  return (
    <svg
      className="jornada__icono"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export default function Home() {
  const { datos: locales, cargando, error } = useApi((opts) => api.restaurantes(opts), []);
  if (error) return <Error error={error} />;

  return (
    <>
      <section className="hero">
        <div className="contenedor hero__fila">
          <div className="hero__texto">
            <h1>Cocina canaria de siempre, en cuatro casas</h1>
            <p className="hero__entradilla">
              Guamasa, Candelaria, La Laguna y La Orotava. Misma cocina, mismo trato,
              cuatro sitios distintos donde sentarse a comer.
            </p>
          </div>

          {/* Las tres acciones juntas arriba a la derecha. Cada una con su
              peso: la reserva rellena en ocre, WhatsApp en el verde mojo
              (que ademas es el color con el que la gente reconoce WhatsApp)
              y la galeria contorneada, que es la menos urgente de las tres. */}
          <div className="hero__acciones">
            <Link className="boton boton--principal" to="/reservar">
              Reservar mesa
            </Link>
            <a
              className="boton hero__whatsapp"
              href={enlaceWhatsApp('Hola, me gustaria hacer una reserva.')}
            >
              WhatsApp {GRUPO.whatsapp}
            </a>
            <Link className="boton hero__galeria" to="/galeria">
              Galeria
            </Link>

            {/*
              La casa que viene, debajo de galeria y del ancho de los botones.

              NO es un boton: esquinas de panel y no de pastilla -en esta web
              las de pastilla son siempre algo que se pulsa- y borde
              discontinuo. No lleva a ningun sitio todavia porque no hay nada
              que enseniar, y un cartel con forma de boton se acaba pulsando:
              la gente pulsa, no pasa nada, y se queda pensando que la web
              esta rota.

              Dice el nombre y ya. Ni donde ni cuando: en cuanto se pone una
              fecha, esa fecha es una promesa que alguien tiene que cumplir, y
              las aperturas se mueven.
            */}
            <p className="proxima">
              <span className="proxima__aviso">Próximamente</span>
              <span className="proxima__nombre">El Baifo</span>
              <span className="proxima__nota">la quinta casa del grupo</span>
            </p>
          </div>
        </div>

      </section>

      <section className="seccion">
        <div className="contenedor">
          {/* Centrado, igual que las cabeceras de las cuatro fichas. El ancho
              maximo pasa del estilo en linea a la clase: centrar un parrafo
              con `text-align` no lo mueve si su caja sigue pegada a la
              izquierda, hace falta tambien el margen automatico, y las dos
              cosas juntas se leen mejor en un sitio que repartidas. */}
          <div className="seccion__intro">
            <h2>Nuestros locales</h2>
            <p className="apagado">
              Cada casa tiene su carta y su caracter. Elige la que te pille mas cerca.
            </p>

            {/*
              Cocina ininterrumpida.

              Es el dato que decide una visita a las cinco de la tarde, que es
              justo cuando la mayoria de los sitios de la isla tienen la cocina
              cerrada. Por eso va aqui arriba y no escondido entre los horarios
              de cada ficha.

              NO es un boton aunque resalte: por eso lleva las esquinas del
              resto de paneles y no las de pastilla, que en esta web son
              siempre algo que se pulsa. Un cartel con forma de boton se acaba
              pulsando, y no lleva a ningun sitio.

              La frase de debajo explica que significa: "ininterrumpida" lo
              entiende el que ya lo busca, y el resto necesita que le digan que
              puede comer a las cinco.
            */}
            <p className="jornada">
              <RelojAbierto />
              <strong className="jornada__titular">Cocina ininterrumpida</strong>
              <span className="jornada__detalle">
                No cerramos entre la comida y la cena, en las cuatro casas
              </span>
            </p>
          </div>

          {cargando ? (
            <Cargando texto="Cargando locales..." />
          ) : (
            <div className="rejilla-locales" style={{ marginTop: '1.75rem' }}>
              {locales.map((local) => (
                <TarjetaLocal key={local.id} local={local} />
              ))}
            </div>
          )}
        </div>
      </section>

    </>
  );
}
