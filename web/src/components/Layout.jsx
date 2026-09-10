import { Link, NavLink, Outlet } from 'react-router-dom';
import { GRUPO, enlaceWhatsApp } from '../datos/grupo.js';
import Logo from './Logo.jsx';
import Platito from './Platito.jsx';
import Idiomas from './Idiomas.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { ui } from '../datos/idioma.js';
import { useIdioma } from '../hooks/useIdioma.js';

/*
  La cabecera y el pie, que salen en todas las pantallas.

  Aqui vive el selector de idioma. Estaba dentro de la carta, y por eso al
  elegir ingles la navegacion, el pie y todo lo demas seguian en castellano:
  quien entraba por la portada no tenia ni donde cambiarlo. Es lo que senalo
  la revision.

  Los nombres de los locales NO se traducen: son nombres propios. "Como en
  Casa" se llama asi en Hamburgo tambien.
*/

export default function Layout() {
  const { datos: locales } = useApi((opts) => api.restaurantes(opts), []);
  const [idioma] = useIdioma();

  return (
    <div className="app">
      <header className="cabecera">
        <div className="contenedor cabecera__fila">
          <Link to="/" className="marca" aria-label={ui('nav.inicio', idioma)}>
            <Logo descriptor="GASTRONOMÍA CANARIA" />
          </Link>

          {/*
            En el movil de esta barra solo queda "Reservar".

            Los cinco enlaces no caben en 390 px: la barra se quedaba en 56 px
            de ancho con 522 de contenido y cuatro de los cinco no se podian
            alcanzar. Y bajarlos a una segunda fila hacia la cabecera de 167
            px, que fija se come el 20% de la pantalla.

            Asi que en el movil se esconden los locales -clase `nav__local`- y
            la cabecera se queda en una fila, que si puede ir fija. A los
            cuatro locales se llega por las tarjetas de la portada y por el
            pie, que los lista enteros. Lo que tiene que estar SIEMPRE a mano
            en un telefono es reservar, no elegir casa.
          */}
          <nav className="nav" aria-label="Locales">
            {(locales ?? []).map((local) => (
              <NavLink
                key={local.slug}
                to={`/${local.slug}`}
                className={({ isActive }) => `nav__local${isActive ? ' activo' : ''}`}
              >
                {local.nombre}
              </NavLink>
            ))}
            <NavLink to="/reservar" className={({ isActive }) => (isActive ? 'activo' : undefined)}>
              {ui('nav.reservar', idioma)}
            </NavLink>
          </nav>

          <div className="cabecera__mandos">
            <Idiomas />
            <Platito />
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="pie">
        <div className="contenedor">
          <div className="pie__rejilla">
            <div>
              <h2>{ui('nav.locales', idioma)}</h2>
              <ul className="pie__lista">
                {(locales ?? []).map((local) => (
                  <li key={local.slug}>
                    <Link to={`/${local.slug}`}>
                      {local.nombre} · {local.municipio}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2>{ui('nav.reservas', idioma)}</h2>
              <ul className="pie__lista">
                <li>
                  <a href={enlaceWhatsApp(ui('nav.saludoWhatsApp', idioma))}>
                    WhatsApp {GRUPO.whatsapp}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${GRUPO.email}`}>{GRUPO.email}</a>
                </li>
              </ul>
            </div>

            {/*
              La columna de fotos entera desaparece si no hay ninguna.

              Eran seis enlaces -la del grupo y una por casa- y los seis caian
              en "todavia no hay fotos publicadas aqui". Un pie lleno de
              callejones sin salida hace parecer rota una web que funciona.
              Cada casa se ensena solo si la suya tiene algo.
            */}
            {(locales ?? []).some((l) => l.fotos > 0) && (
              <div>
                <h2>{ui('nav.fotos', idioma)}</h2>
                <ul className="pie__lista">
                  <li>
                    <Link to="/galeria">{ui('nav.galeriaGrupo', idioma)}</Link>
                  </li>
                  {(locales ?? [])
                    .filter((local) => local.fotos > 0)
                    .map((local) => (
                      <li key={local.slug}>
                        <Link to={`/${local.slug}/galeria`}>
                          {ui('nav.fotosDe', idioma, { local: local.nombre })}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div>
              <h2>{ui('nav.siguenos', idioma)}</h2>
              <ul className="pie__lista">
                <li>
                  <a href={GRUPO.instagram} target="_blank" rel="noreferrer">
                    Instagram @grupocobama
                  </a>
                </li>
                <li>
                  <a href={GRUPO.tiktok} target="_blank" rel="noreferrer">
                    TikTok @grupocobama
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <p className="pie__legal">
            © {new Date().getFullYear()} {GRUPO.nombre} · {GRUPO.sede}
            {' · '}
            <Link to="/aviso-legal">{ui('nav.avisoLegal', idioma)}</Link>
            {' · '}
            <Link to="/privacidad">{ui('nav.privacidad', idioma)}</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
