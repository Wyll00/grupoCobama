import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useMetadatos } from '../hooks/useMetadatos.js';
import { api } from '../api/client.js';
import { Cargando, Error } from '../components/Estado.jsx';
import { GRUPO, enlaceWhatsApp, enlaceTelefono } from '../datos/grupo.js';
import { LEGAL, VERSION_POLITICA } from '../datos/legal.js';

/** Hoy en formato AAAA-MM-DD, que es lo que espera <input type="date">. */
const hoy = () => new Date().toLocaleDateString('en-CA');

const maximo = () => {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toLocaleDateString('en-CA');
};

const enLargo = (fecha) =>
  new Date(`${fecha}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const VACIO = {
  restaurante_id: '',
  fecha: '',
  hora: '',
  comensales: 2,
  nombre: '',
  telefono: '',
  email: '',
  observaciones: '',
  // No es el consentimiento para tratar los datos de la reserva: eso se
  // apoya en el contrato y no se puede negar sin quedarse sin mesa. Esto es
  // la prueba de que se informo, que es lo que pide el art. 13 del RGPD.
  politicaLeida: false,
  // Consentimiento de verdad: voluntario, aparte y desmarcado.
  marketing: false,
};

/**
 * La reserva entra como SOLICITUD: queda pendiente hasta que alguien del local
 * la confirma. No hay control de aforo ni de mesas, que es un proyecto en si
 * mismo; hoy el grupo lo lleva por WhatsApp, asi que un registro estructurado
 * ya es una mejora.
 */
export default function Reservar() {
  const [params] = useSearchParams();
  const locales = useApi((opts) => api.restaurantes(opts), []);

  const [form, setForm] = useState(() => ({ ...VACIO, fecha: hoy() }));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [hecha, setHecha] = useState(null);

  useMetadatos({
    descripcion: 'Reserva mesa en cualquiera de los cuatro locales del Grupo Cobama.',
  });

  const lista = locales.datos ?? [];

  // Si se llega desde la ficha de un local, viene ya elegido.
  useEffect(() => {
    if (form.restaurante_id || lista.length === 0) return;
    const slug = params.get('local');
    const elegido = slug ? lista.find((l) => l.slug === slug) : null;
    if (elegido) setForm((f) => ({ ...f, restaurante_id: String(elegido.id) }));
  }, [lista, params, form.restaurante_id]);

  // Las horas dependen del local y del dia: cada casa tiene su horario y los
  // viernes y sabados cierran mas tarde. Las calcula la API, que es quien sabe
  // el horario de verdad y hasta que hora se sienta antes de cerrar.
  const tramos = useApi(
    (opts) =>
      form.restaurante_id && form.fecha
        ? api.tramosReserva(form.restaurante_id, form.fecha, opts)
        : Promise.resolve(null),
    [form.restaurante_id, form.fecha]
  );

  const horasDisponibles = useMemo(() => tramos.datos?.tramos ?? [], [tramos.datos]);

  // Si la hora elegida deja de existir al cambiar de dia o de local, se limpia.
  useEffect(() => {
    if (form.hora && horasDisponibles.length > 0 && !horasDisponibles.includes(form.hora)) {
      setForm((f) => ({ ...f, hora: '' }));
    }
  }, [horasDisponibles, form.hora]);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const marcar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.checked }));

  const local = lista.find((l) => String(l.id) === String(form.restaurante_id));

  // Hay locales que llevan sus reservas en su propio sistema. Si se deja el
  // formulario a la vista, alguien lo rellena y esa reserva cae en una
  // bandeja que ese local ya no mira: el cliente se presenta convencido de
  // tener mesa. Mejor decirlo y mandarlo donde toca.
  const reservaFuera = local?.url_reservas ?? null;

  const completo =
    form.restaurante_id &&
    form.fecha &&
    form.hora &&
    form.nombre.trim().length >= 2 &&
    form.telefono.trim().length >= 6 &&
    form.politicaLeida;

  // Pedir permiso para mandar novedades a quien no ha dejado email es recoger
  // un consentimiento que no se puede usar. Solo aparece si hay email.
  const hayEmail = form.email.trim().length > 0;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const { politicaLeida, marketing, ...campos } = form;
      setHecha(
        await api.crearReserva({
          ...campos,
          restaurante_id: Number(form.restaurante_id),
          comensales: Number(form.comensales),
          // Se manda la version concreta que se le ha ensenado, no un true:
          // cuando el texto cambie hay que poder saber cual leyo cada uno.
          politica_version: politicaLeida ? VERSION_POLITICA : '',
          marketing: Boolean(marketing && hayEmail),
        })
      );
    } catch (err) {
      setError(err.detalles?.length ? err.detalles.map((d) => d.mensaje).join('. ') : err.message);
      setEnviando(false);
    }
  };

  if (locales.error) return <Error error={locales.error} />;

  if (hecha) {
    return (
      <section className="seccion">
        <div className="contenedor reserva-hecha">
          <h1>Reserva enviada</h1>
          <p className="reserva-hecha__codigo">{hecha.codigo}</p>

          <p>
            Hemos recibido tu solicitud para <strong>{hecha.restaurante}</strong> el{' '}
            <strong>{enLargo(hecha.fecha)}</strong> a las{' '}
            <strong>{hecha.hora.slice(0, 5)}</strong>, para {hecha.comensales}{' '}
            {hecha.comensales === 1 ? 'persona' : 'personas'}.
          </p>

          <div className="aviso">
            <strong>Todavia no esta confirmada.</strong> El local la revisa y te avisa. Si
            es para dentro de poco, mejor llama por telefono y lo cerramos al momento.
          </div>

          <p className="apagado">
            Guarda el codigo <strong>{hecha.codigo}</strong>: con el te localizamos la
            reserva si nos llamas.
          </p>

          <div className="hero__acciones">
            <a
              className="boton boton--principal"
              href={enlaceWhatsApp(
                `Hola, acabo de reservar con el codigo ${hecha.codigo} a nombre de ${form.nombre}.`
              )}
            >
              Escribir por WhatsApp
            </a>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => {
                setHecha(null);
                setEnviando(false);
                setForm({ ...VACIO, fecha: hoy() });
              }}
            >
              Hacer otra reserva
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="ficha__cabecera" style={{ paddingBlock: '2.5rem' }}>
        <div className="contenedor">
          <h1>Reservar mesa</h1>
          <p>
            Dinos cuando y cuantos sois. El local te confirma en cuanto lo vea. Si es para
            dentro de un rato, llama mejor por telefono.
          </p>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          {locales.cargando ? (
            <Cargando texto="Cargando locales..." />
          ) : (
            <form className="reserva" onSubmit={enviar}>
              {error && <div className="aviso aviso--error">{error}</div>}

              <label className="reserva__campo">
                <span>Local</span>
                <select
                  className="buscador"
                  value={form.restaurante_id}
                  onChange={cambiar('restaurante_id')}
                  required
                >
                  <option value="">Elige un local</option>
                  {lista.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre} · {l.municipio}
                    </option>
                  ))}
                </select>
              </label>

              {reservaFuera ? (
                <div className="derivacion">
                  <p>
                    <strong>{local.nombre}</strong> lleva sus reservas en su propio sistema.
                    Se abre en otra pestana y esta pagina se queda aqui.
                  </p>
                  <a
                    className="boton boton--principal"
                    href={reservaFuera}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Reservar en {local.nombre}
                  </a>
                  <p className="apagado" style={{ fontSize: '0.85rem' }}>
                    Si prefieres, llama al{' '}
                    <a href={enlaceTelefono(local.telefono)}>{local.telefono}</a>.
                  </p>
                </div>
              ) : (
                <>
              <div className="reserva__fila">
                <label className="reserva__campo">
                  <span>Dia</span>
                  <input
                    className="buscador"
                    type="date"
                    value={form.fecha}
                    min={hoy()}
                    max={maximo()}
                    onChange={cambiar('fecha')}
                    required
                  />
                </label>

                <label className="reserva__campo">
                  <span>Hora</span>
                  <select
                    className="buscador"
                    value={form.hora}
                    onChange={cambiar('hora')}
                    disabled={!form.restaurante_id || tramos.cargando}
                    required
                  >
                    <option value="">
                      {!form.restaurante_id
                        ? 'Elige primero el local'
                        : tramos.cargando
                          ? 'Cargando...'
                          : tramos.datos?.cerrado
                            ? 'Ese dia esta cerrado'
                            : horasDisponibles.length === 0
                              ? 'No quedan horas ese dia'
                              : 'Elige una hora'}
                    </option>
                    {horasDisponibles.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="reserva__campo">
                  <span>Comensales</span>
                  <input
                    className="buscador"
                    type="number"
                    min="1"
                    max="50"
                    value={form.comensales}
                    onChange={cambiar('comensales')}
                    required
                  />
                </label>
              </div>

              {local && tramos.datos?.cerrado && (
                <div className="aviso">
                  {local.nombre} cierra ese dia. Prueba otra fecha u otro local.
                </div>
              )}

              {/*
                Por que faltan horas.

                Sin esto, quien abra el desplegable un sabado ve que salta de
                las 12:45 a las 17:00 y no sabe si esta lleno, si la web falla
                o si el local cierra a mediodia. Un hueco sin explicacion se
                lee como un error, y quien cree que la web esta rota no lo
                intenta otra vez: se va.

                Y dice que puede venirse igual, que es el motivo de que la
                franja exista: esas mesas se guardan justo para eso.
              */}
              {tramos.datos?.sinReservas && (
                <div className="aviso">
                  <strong>
                    De {tramos.datos.sinReservas.desde} a {tramos.datos.sinReservas.hasta} no
                    cogemos reservas ese dia.
                  </strong>{' '}
                  La cocina esta abierta: esas mesas las guardamos para quien llega sin
                  reservar. Puedes venirte igual, o reservar antes o despues.
                </div>
              )}

              {/*
                `autocomplete` en los tres campos personales. La mayoria de las
                reservas se hacen desde el movil, muchas veces con prisa, y sin
                esto el telefono no ofrece rellenar el nombre, el numero ni el
                correo: hay que teclearlos. Cada campo que se teclea a mano es
                una oportunidad de abandonar el formulario a medias.

                Los nombres son los del estandar y no cualquier palabra: el
                navegador solo reconoce esos. "telefono" en vez de "tel" no
                hace nada y no avisa.
              */}
              <div className="reserva__fila">
                <label className="reserva__campo">
                  <span>Nombre de la reserva</span>
                  <input
                    className="buscador"
                    name="nombre"
                    autoComplete="name"
                    value={form.nombre}
                    onChange={cambiar('nombre')}
                    placeholder="A nombre de..."
                    required
                  />
                </label>

                <label className="reserva__campo">
                  <span>Telefono</span>
                  <input
                    className="buscador"
                    type="tel"
                    name="telefono"
                    autoComplete="tel"
                    value={form.telefono}
                    onChange={cambiar('telefono')}
                    placeholder="Para avisarte"
                    required
                  />
                </label>
              </div>

              <label className="reserva__campo">
                <span>
                  Email <span className="apagado">(opcional)</span>
                </span>
                <input
                  className="buscador"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={cambiar('email')}
                  placeholder="Para mandarte la confirmacion"
                />
              </label>

              <label className="reserva__campo">
                <span>
                  Algo que debamos saber <span className="apagado">(opcional)</span>
                </span>
                <textarea
                  className="buscador"
                  rows={3}
                  value={form.observaciones}
                  onChange={cambiar('observaciones')}
                  placeholder="Alergias, trona, celebracion, si venis con perro..."
                />
              </label>

              <div className="consentimiento">
                <p className="consentimiento__info">
                  Tus datos los trata <strong>{LEGAL.razonSocial}</strong> para gestionar
                  esta reserva y avisarte, porque son necesarios para poder atenderte. Se
                  guardan {LEGAL.conservacion.reservaMeses} meses y los ve el local y{' '}
                  {LEGAL.encargados[0]?.nombre}, que nos lleva el libro de reservas. Puedes
                  acceder a ellos, corregirlos o pedir que los borremos escribiendo a{' '}
                  <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a>.
                  Lo tienes todo detallado en la{' '}
                  <Link to="/privacidad" target="_blank">
                    politica de privacidad
                  </Link>
                  .
                </p>

                <label className="consentimiento__casilla">
                  <input
                    type="checkbox"
                    checked={form.politicaLeida}
                    onChange={marcar('politicaLeida')}
                    required
                  />
                  <span>
                    He leido y entiendo la{' '}
                    <Link to="/privacidad" target="_blank">
                      politica de privacidad
                    </Link>
                    .
                  </span>
                </label>

                {hayEmail && (
                  <label className="consentimiento__casilla">
                    <input
                      type="checkbox"
                      checked={form.marketing}
                      onChange={marcar('marketing')}
                    />
                    <span>
                      Quiero recibir novedades y menus especiales por email.{' '}
                      <span className="apagado">
                        Es voluntario, tu reserva funciona igual, y puedes darte de baja
                        cuando quieras.
                      </span>
                    </span>
                  </label>
                )}
              </div>

              <button
                className="boton boton--principal"
                type="submit"
                disabled={!completo || enviando}
              >
                {enviando ? 'Enviando...' : 'Pedir la reserva'}
              </button>
                </>
              )}

              <p className="apagado" style={{ fontSize: '0.85rem' }}>
                Tambien puedes reservar por WhatsApp al{' '}
                <a href={enlaceWhatsApp('Hola, me gustaria hacer una reserva.')}>
                  {GRUPO.whatsapp}
                </a>
                .
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
