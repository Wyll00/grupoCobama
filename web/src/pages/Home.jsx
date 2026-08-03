import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import TarjetaLocal from '../components/TarjetaLocal.jsx';
import { Cargando, Error } from '../components/Estado.jsx';
import { GRUPO, enlaceWhatsApp } from '../datos/grupo.js';

export default function Home() {
  const { datos: locales, cargando, error } = useApi((opts) => api.restaurantes(opts), []);

  if (error) return <Error error={error} />;

  return (
    <>
      <section className="hero">
        <div className="contenedor">
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
      </section>

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
