import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Cargando, Error } from '../components/Estado.jsx';
import { enlaceWhatsApp } from '../datos/grupo.js';

/**
 * Fase 1: el formulario compone el mensaje y lo abre en WhatsApp, que es como
 * el grupo gestiona hoy las reservas. En la fase 3 este mismo formulario hara
 * POST /api/reservas y quedara registrado en base de datos.
 */
export default function Reservar() {
  const [params] = useSearchParams();
  const { datos: locales, cargando, error } = useApi((opts) => api.restaurantes(opts), []);

  const [form, setForm] = useState({
    local: params.get('local') ?? '',
    nombre: '',
    fecha: '',
    hora: '',
    comensales: '2',
    observaciones: '',
  });

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  if (error) return <Error error={error} />;
  if (cargando) return <Cargando />;

  const elegido = locales.find((l) => l.slug === form.local);
  const completo = Boolean(form.local && form.nombre && form.fecha && form.hora);

  const mensaje = [
    `Hola, me gustaria reservar mesa en ${elegido?.nombre ?? ''}.`,
    '',
    `Nombre: ${form.nombre}`,
    `Dia: ${form.fecha}`,
    `Hora: ${form.hora}`,
    `Personas: ${form.comensales}`,
    form.observaciones ? `Observaciones: ${form.observaciones}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n');

  return (
    <>
      <section className="ficha__cabecera" style={{ paddingBlock: '2.5rem' }}>
        <div className="contenedor">
          <h1>Reservar mesa</h1>
          <p>Rellena los datos y te abrimos WhatsApp con el mensaje ya escrito.</p>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor" style={{ maxWidth: '640px' }}>
          <form
            style={{ display: 'grid', gap: '1rem' }}
            onSubmit={(e) => e.preventDefault()}
          >
            <Campo etiqueta="Local">
              <select className="buscador" value={form.local} onChange={cambiar('local')} required>
                <option value="">Elige un local</option>
                {locales.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.nombre} · {l.municipio}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Nombre de la reserva">
              <input
                className="buscador"
                value={form.nombre}
                onChange={cambiar('nombre')}
                placeholder="A nombre de..."
                required
              />
            </Campo>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <Campo etiqueta="Dia">
                <input
                  type="date"
                  className="buscador"
                  value={form.fecha}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={cambiar('fecha')}
                  required
                />
              </Campo>
              <Campo etiqueta="Hora">
                <input
                  type="time"
                  className="buscador"
                  value={form.hora}
                  onChange={cambiar('hora')}
                  step="900"
                  required
                />
              </Campo>
            </div>

            <Campo etiqueta="Comensales">
              <input
                type="number"
                className="buscador"
                min="1"
                max="40"
                value={form.comensales}
                onChange={cambiar('comensales')}
              />
            </Campo>

            <Campo etiqueta="Observaciones (opcional)">
              <textarea
                className="buscador"
                rows="3"
                value={form.observaciones}
                onChange={cambiar('observaciones')}
                placeholder="Trona, alergias, celebracion..."
              />
            </Campo>

            {elegido && (
              <div className="aviso">
                <strong>Horario de {elegido.nombre}:</strong>
                <br />
                {elegido.horarios.map((t) => `${t.dias}: ${t.horario}`).join(' · ')}
              </div>
            )}

            <a
              className="boton boton--principal"
              href={completo ? enlaceWhatsApp(mensaje) : undefined}
              aria-disabled={!completo}
              style={{
                justifySelf: 'start',
                opacity: completo ? 1 : 0.5,
                pointerEvents: completo ? 'auto' : 'none',
              }}
            >
              Enviar por WhatsApp
            </a>

            {!completo && (
              <p className="apagado" style={{ fontSize: '0.85rem', margin: 0 }}>
                Completa local, nombre, dia y hora para continuar.
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}

function Campo({ etiqueta, children }) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span
        style={{
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--texto-suave)',
          fontWeight: 600,
        }}
      >
        {etiqueta}
      </span>
      {children}
    </label>
  );
}
