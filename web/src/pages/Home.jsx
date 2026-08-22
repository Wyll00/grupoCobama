import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import TarjetaLocal from '../components/TarjetaLocal.jsx';
import Carrusel from '../components/Carrusel.jsx';
import { Cargando, Error } from '../components/Estado.jsx';
import { GRUPO, enlaceWhatsApp } from '../datos/grupo.js';

const Visor = lazy(() => import('../components/Visor.jsx'));

export default function Home() {
  const { datos: locales, cargando, error } = useApi((opts) => api.restaurantes(opts), []);
  const galeria = useApi((opts) => api.galeria(null, null, opts), []);
  const [abierta, setAbierta] = useState(null);

  const fotos = galeria.datos?.fotos ?? [];

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
          <div className="hero__acciones">
            <Link className="boton boton--principal" to="/reservar">
              Reservar mesa
            </Link>
            <a
              className="boton boton--secundario"
              style={{ borderColor: '#4a413a', color: 'var(--crema)' }}
              href={enlaceWhatsApp('Hola, me gustaria hacer una reserva.')}
            >
              WhatsApp {GRUPO.whatsapp}
            </a>
          </div>
          </div>

          <Link className="hero__galeria" to="/galeria">
            Galeria
          </Link>
        </div>
      </section>

      {fotos.length > 0 && (
        <section className="seccion seccion--fotos">
          <div className="contenedor">
            <div className="seccion__cabecera">
              <div>
                <h2>Asi se ve por dentro</h2>
                <p className="apagado" style={{ maxWidth: '52ch' }}>
                  Los platos, las salas y lo que se cuece en las cuatro casas.
                </p>
              </div>
              <Link className="boton boton--secundario" to="/galeria">
                Ver toda la galeria
              </Link>
            </div>

            <Carrusel fotos={fotos} onAbrir={setAbierta} />
          </div>
        </section>
      )}

      {abierta !== null && (
        <Suspense fallback={null}>
          <Visor
            fotos={fotos}
            indice={abierta}
            onCerrar={() => setAbierta(null)}
            onCambiar={setAbierta}
          />
        </Suspense>
      )}

      <section className="seccion">
        <div className="contenedor">
          <h2>Nuestros locales</h2>
          <p className="apagado" style={{ maxWidth: '60ch' }}>
            Cada casa tiene su carta y su caracter. Elige la que te pille mas cerca.
          </p>

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

      <section className="seccion" style={{ paddingTop: 0 }}>
        <div className="contenedor">
          <div className="aviso">
            <strong>Alergias e intolerancias.</strong> En la carta de cada local puedes
            filtrar los platos por alergeno. Aun asi, avisa siempre al personal de sala:
            trabajamos con cocina compartida.
          </div>
        </div>
      </section>
    </>
  );
}
