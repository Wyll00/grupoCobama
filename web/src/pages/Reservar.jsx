import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useMetadatos } from '../hooks/useMetadatos.js';
import { api } from '../api/client.js';
import { Cargando, Error } from '../components/Estado.jsx';
import { GRUPO, enlaceWhatsApp, enlaceTelefono } from '../datos/grupo.js';
import { LEGAL, VERSION_POLITICA } from '../datos/legal.js';
import { ui } from '../datos/idioma.js';
import { useIdioma } from '../hooks/useIdioma.js';
import Frase from '../components/Frase.jsx';

/** Hoy en formato AAAA-MM-DD, que es lo que espera <input type="date">. */
const hoy = () => new Date().toLocaleDateString('en-CA');

const maximo = () => {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toLocaleDateString('en-CA');
};

const LOCALE = { es: 'es-ES', en: 'en-GB', de: 'de-DE' };

/*
  La fecha, escrita larga y en el idioma de quien mira.

  El navegador ya sabe hacerlo: "sábado, 4 de octubre" en aleman es
  "Samstag, 4. Oktober", y no solo cambian los nombres, tambien el orden y el
  punto detras del numero. Escribirlo a mano seria reimplementar un
  calendario por idioma.
*/
const enLargo = (fecha, idioma = 'es') =>
  new Date(`${fecha}T12:00:00Z`).toLocaleDateString(LOCALE[idioma] ?? LOCALE.es, {
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
  const [idioma] = useIdioma();

  useMetadatos({ descripcion: ui('res.metaDescripcion', idioma) });

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

  /*
    Las horas que rodean el hueco, sacadas de las que de verdad se ofrecen y no
    de restarle un cuarto de hora a la franja.

    La franja empieza a las 13:15 porque las 13:00 si se reservan, pero decirle
    a un cliente "de 13:15 a 17:00" suena a hora inventada. Lo que quiere saber
    es hasta cuando puede pedir mesa: "la ultima a las 13:00". Y si se saca de
    la lista real, no puede contradecirla nunca.

    `ultima` puede no existir: un sabado por la tarde ya han pasado todas las
    de la manana y la lista empieza directamente a las 17:00. Por eso el aviso
    tiene dos redacciones.
  */
  const [ultimaAntesDelHueco, primeraDespuesDelHueco] = useMemo(() => {
    const franja = tramos.datos?.sinReservas;
    if (!franja) return [null, null];
    const antes = horasDisponibles.filter((h) => h < franja.desde);
    const despues = horasDisponibles.filter((h) => h >= franja.hasta);
    return [antes.at(-1) ?? null, despues[0] ?? franja.hasta];
  }, [horasDisponibles, tramos.datos]);

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
          <h1>{ui('res.enviada', idioma)}</h1>
          <p className="reserva-hecha__codigo">{hecha.codigo}</p>

          <p>
            <Frase
              clave="res.recibido"
              valores={{
                local: hecha.restaurante,
                fecha: enLargo(hecha.fecha, idioma),
                hora: hecha.hora.slice(0, 5),
                comensales: ui(
                  hecha.comensales === 1 ? 'res.unaPersona' : 'res.variasPersonas',
                  idioma,
                  { n: hecha.comensales }
                ),
              }}
            />
          </p>

          <div className="aviso">
            <strong>{ui('res.sinConfirmar', idioma)}</strong>{' '}
            {ui('res.sinConfirmarDetalle', idioma)}
          </div>

          <p className="apagado">
            <Frase clave="res.guardaCodigo" valores={{ codigo: hecha.codigo }} />
          </p>

          <div className="hero__acciones">
            <a
              className="boton boton--principal"
              href={enlaceWhatsApp(
                ui('res.whatsappHecha', idioma, {
                  codigo: hecha.codigo,
                  nombre: form.nombre,
                })
              )}
            >
              {ui('res.escribirWhatsApp', idioma)}
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
              {ui('res.otraReserva', idioma)}
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
          <h1>{ui('res.titulo', idioma)}</h1>
          <p>{ui('res.entradilla', idioma)}</p>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          {locales.cargando ? (
            <Cargando texto={ui('home.cargandoLocales', idioma)} />
          ) : (
            <form className="reserva" onSubmit={enviar}>
              {error && <div className="aviso aviso--error">{error}</div>}

              <label className="reserva__campo">
                <span>{ui('res.local', idioma)}</span>
                <select
                  className="buscador"
                  value={form.restaurante_id}
                  onChange={cambiar('restaurante_id')}
                  required
                >
                  <option value="">{ui('res.eligeLocal', idioma)}</option>
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
                    <Frase clave="res.fuera" valores={{ local: local.nombre }} />
                  </p>
                  <a
                    className="boton boton--principal"
                    href={reservaFuera}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ui('res.reservarEn', idioma, { local: local.nombre })}
                  </a>
                  <p className="apagado" style={{ fontSize: '0.85rem' }}>
                    <Frase
                      clave="res.oLlama"
                      valores={{
                        telefono: (
                          <a href={enlaceTelefono(local.telefono)}>{local.telefono}</a>
                        ),
                      }}
                    />
                  </p>
                </div>
              ) : (
                <>
              <div className="reserva__fila">
                <label className="reserva__campo">
                  <span>{ui('res.dia', idioma)}</span>
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
                  <span>{ui('res.hora', idioma)}</span>
                  <select
                    className="buscador"
                    value={form.hora}
                    onChange={cambiar('hora')}
                    disabled={!form.restaurante_id || tramos.cargando}
                    required
                  >
                    <option value="">
                      {ui(
                        !form.restaurante_id
                          ? 'res.eligePrimeroLocal'
                          : tramos.cargando
                            ? 'res.cargando'
                            : tramos.datos?.cerrado
                              ? 'res.diaCerrado'
                              : horasDisponibles.length === 0
                                ? 'res.sinHoras'
                                : 'res.eligeHora',
                        idioma
                      )}
                    </option>
                    {horasDisponibles.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="reserva__campo">
                  <span>{ui('res.comensales', idioma)}</span>
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
                  {ui('res.cierraEseDia', idioma, { local: local.nombre })}
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
                    {ultimaAntesDelHueco
                      ? ui('res.huecoConAntes', idioma, {
                          ultima: ultimaAntesDelHueco,
                          primera: primeraDespuesDelHueco,
                        })
                      : ui('res.huecoSinAntes', idioma, {
                          primera: primeraDespuesDelHueco,
                        })}
                  </strong>{' '}
                  {ui('res.huecoMotivo', idioma)}
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
                  <span>{ui('res.nombre', idioma)}</span>
                  <input
                    className="buscador"
                    name="nombre"
                    autoComplete="name"
                    value={form.nombre}
                    onChange={cambiar('nombre')}
                    placeholder={ui('res.nombrePista', idioma)}
                    required
                  />
                </label>

                <label className="reserva__campo">
                  <span>{ui('res.telefono', idioma)}</span>
                  <input
                    className="buscador"
                    type="tel"
                    name="telefono"
                    autoComplete="tel"
                    value={form.telefono}
                    onChange={cambiar('telefono')}
                    placeholder={ui('res.telefonoPista', idioma)}
                    required
                  />
                </label>
              </div>

              <label className="reserva__campo">
                <span>
                  {ui('res.email', idioma)}{' '}
                  <span className="apagado">{ui('res.opcional', idioma)}</span>
                </span>
                <input
                  className="buscador"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={cambiar('email')}
                  placeholder={ui('res.emailPista', idioma)}
                />
              </label>

              <label className="reserva__campo">
                <span>
                  {ui('res.observaciones', idioma)}{' '}
                  <span className="apagado">{ui('res.opcional', idioma)}</span>
                </span>
                <textarea
                  className="buscador"
                  rows={3}
                  value={form.observaciones}
                  onChange={cambiar('observaciones')}
                  placeholder={ui('res.observacionesPista', idioma)}
                />
              </label>

              <div className="consentimiento">
                <p className="consentimiento__info">
                  <Frase
                    clave="res.consentimiento"
                    valores={{
                      responsable: LEGAL.razonSocial,
                      meses: LEGAL.conservacion.reservaMeses,
                      encargado: LEGAL.encargados[0]?.nombre,
                      email: (
                        <a href={`mailto:${LEGAL.emailPrivacidad}`}>
                          {LEGAL.emailPrivacidad}
                        </a>
                      ),
                      politica: (
                        <Link to="/privacidad" target="_blank">
                          {ui('res.politica', idioma)}
                        </Link>
                      ),
                    }}
                  />
                </p>

                <label className="consentimiento__casilla">
                  <input
                    type="checkbox"
                    checked={form.politicaLeida}
                    onChange={marcar('politicaLeida')}
                    required
                  />
                  <span>
                    <Frase
                      clave="res.heLeido"
                      valores={{
                        politica: (
                          <Link to="/privacidad" target="_blank">
                            {ui('res.politica', idioma)}
                          </Link>
                        ),
                      }}
                    />
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
                      {ui('res.marketing', idioma)}{' '}
                      <span className="apagado">{ui('res.marketingNota', idioma)}</span>
                    </span>
                  </label>
                )}
              </div>

              <button
                className="boton boton--principal"
                type="submit"
                disabled={!completo || enviando}
              >
                {ui(enviando ? 'res.enviando' : 'res.pedir', idioma)}
              </button>
                </>
              )}

              <p className="apagado" style={{ fontSize: '0.85rem' }}>
                <Frase
                  clave="res.tambienWhatsApp"
                  valores={{
                    numero: (
                      <a href={enlaceWhatsApp(ui('nav.saludoWhatsApp', idioma))}>
                        {GRUPO.whatsapp}
                      </a>
                    ),
                  }}
                />
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
