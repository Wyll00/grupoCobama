import { Link, NavLink, Outlet } from 'react-router-dom';
import { GRUPO, enlaceWhatsApp } from '../datos/grupo.js';
import Logo from './Logo.jsx';
import Platito from './Platito.jsx';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';

export default function Layout() {
  const { datos: locales } = useApi((opts) => api.restaurantes(opts), []);

  return (
    <div className="app">
      <header className="cabecera">
        <div className="contenedor cabecera__fila">
          <Link to="/" className="marca" aria-label="Grupo Cobama, ir al inicio">
            <Logo descriptor="GASTRONOMÍA CANARIA" />
          </Link>

          <nav className="nav" aria-label="Locales">
            {(locales ?? []).map((local) => (
              <NavLink
                key={local.slug}
                to={`/${local.slug}`}
                className={({ isActive }) => (isActive ? 'activo' : undefined)}
              >
                {local.nombre}
              </NavLink>
            ))}
            <NavLink to="/reservar" className={({ isActive }) => (isActive ? 'activo' : undefined)}>
              Reservar
            </NavLink>
          </nav>

          <Platito />
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="pie">
        <div className="contenedor">
          <div className="pie__rejilla">
            <div>
              <h2>Nuestros locales</h2>
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
              <h2>Reservas</h2>
              <ul className="pie__lista">
                <li>
                  <a href={enlaceWhatsApp('Hola, me gustaria hacer una reserva.')}>
                    WhatsApp {GRUPO.whatsapp}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${GRUPO.email}`}>{GRUPO.email}</a>
                </li>
              </ul>
            </div>

            <div>
              <h2>Fotos</h2>
              <ul className="pie__lista">
                <li>
                  <Link to="/galeria">Galeria del grupo</Link>
                </li>
                {(locales ?? []).map((local) => (
                  <li key={local.slug}>
                    <Link to={`/${local.slug}/galeria`}>Fotos de {local.nombre}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2>Siguenos</h2>
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
            <Link to="/aviso-legal">Aviso legal</Link>
            {' · '}
            <Link to="/privacidad">Privacidad</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
