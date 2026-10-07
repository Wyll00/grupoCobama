import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useSocio } from '../hooks/useSocio.js';
import { LEGAL, VERSION_POLITICA } from '../datos/legal.js';

/**
 * Hacerse socio desde la web.
 *
 * SE PIDE LO MINIMO: el nombre y una forma de avisar. Nada de fecha de
 * nacimiento ni direccion, que es lo que convierte un formulario de un minuto
 * en uno que nadie termina. Y nada de contrasena: ver `useSocio.js` para por
 * que esto no es una cuenta y por que no hace falta que lo sea.
 *
 * El contacto es obligatorio pero da igual cual de los dos. Quien no quiera
 * dar el correo da el telefono y al reves; lo que no puede ser es ninguno,
 * porque entonces una tarjeta perdida es irrecuperable y no hay forma de
 * avisar del premio. Eso lo exige tambien la API, no solo esta pantalla.
 *
 * Al terminar NO se ensena una pantalla de "listo": se entra directo a la
 * tarjeta, con su codigo y su QR delante. Es lo unico que esta persona no
 * puede perder, y un "listo" con un boton de continuar es una oportunidad mas
 * de cerrar la pestana antes de verlo.
 */
export default function SocioAlta() {
  const { entrar } = useSocio();
  const navegar = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    politicaLeida: false,
    marketing: false,
  });
  const [error, setError] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const marcar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.checked }));

  const hayContacto = Boolean(form.telefono.trim() || form.email.trim());
  const completo = form.nombre.trim().length >= 2 && hayContacto && form.politicaLeida;

  const enviar = async (e) => {
    e.preventDefault();
    if (!completo) return;

    setEnviando(true);
    setError(null);
    setDetalles([]);

    try {
      const tarjeta = await api.crearSocio({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        // La version, no un simple "si": cuando el texto de la politica
        // cambie, hay que poder saber cual se enseno. Igual que en reservas.
        politica_version: VERSION_POLITICA,
        marketing: form.marketing,
      });

      // Se recuerda ANTES de navegar: asi el perfil ya la encuentra puesta y
      // la cabecera cambia a "Mi tarjeta de socio" sin un parpadeo.
      entrar(tarjeta.codigo);
      navegar(`/socio/${tarjeta.codigo}`, { replace: true });
    } catch (err) {
      setError(err.message ?? 'No se ha podido crear la tarjeta');
      setDetalles(err.detalles ?? []);
      setEnviando(false);
    }
  };

  return (
    <section className="seccion">
      <div className="contenedor socio-alta">
        <h1>Hazte socio</h1>
        <p className="apagado">
          Te hacemos la tarjeta ahora mismo. Vale en las cuatro casas, y a las cinco
          visitas hay premio.
        </p>

        <form onSubmit={enviar} noValidate>
          {error && (
            <div className="aviso aviso--error">
              {error}
              {detalles.length > 0 && (
                <ul>
                  {detalles.map((d, i) => (
                    <li key={i}>{d.mensaje}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <label className="reserva__campo">
            <span>Tu nombre</span>
            <input
              className="buscador"
              value={form.nombre}
              onChange={cambiar('nombre')}
              placeholder="Nombre y apellidos"
              autoComplete="name"
              maxLength={120}
              autoFocus
              required
            />
          </label>

          <label className="reserva__campo">
            <span>Teléfono</span>
            <input
              className="buscador"
              type="tel"
              value={form.telefono}
              onChange={cambiar('telefono')}
              placeholder="+34 600 000 000"
              autoComplete="tel"
              maxLength={30}
            />
          </label>

          <label className="reserva__campo">
            <span>Correo</span>
            <input
              className="buscador"
              type="email"
              value={form.email}
              onChange={cambiar('email')}
              placeholder="tucorreo@ejemplo.es"
              autoComplete="email"
              maxLength={150}
            />
          </label>

          {/* El aviso de que hace falta uno de los dos sale antes de enviar,
              no despues. Dos campos marcados "opcional" de los que en realidad
              hay que rellenar uno es una trampa si solo se dice al fallar. */}
          <p className={`socio-alta__contacto ${hayContacto ? 'socio-alta__contacto--ok' : ''}`}>
            {hayContacto
              ? 'Con eso podemos avisarte cuando llegues al premio.'
              : 'Hace falta al menos uno de los dos: es como te avisamos del premio y como recuperamos tu tarjeta si la pierdes.'}
          </p>

          <div className="consentimiento">
            <p className="consentimiento__info">
              Los datos los trata {LEGAL.razonSocial} para llevar tu tarjeta de socio y
              las visitas asociadas. Puedes pedir verlos, cambiarlos o borrarlos
              escribiendo a{' '}
              <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a>.
            </p>

            <label className="consentimiento__casilla">
              <input
                type="checkbox"
                checked={form.politicaLeida}
                onChange={marcar('politicaLeida')}
                required
              />
              <span>
                He leído la{' '}
                <Link to="/privacidad" target="_blank">
                  política de privacidad
                </Link>
                .
              </span>
            </label>

            <label className="consentimiento__casilla">
              <input type="checkbox" checked={form.marketing} onChange={marcar('marketing')} />
              <span>
                Quiero que me avisen de novedades y ofertas.{' '}
                <span className="apagado">Opcional. Se puede quitar cuando quieras.</span>
              </span>
            </label>
          </div>

          <button className="boton boton--principal" type="submit" disabled={!completo || enviando}>
            {enviando ? 'Haciendo tu tarjeta...' : 'Hazme la tarjeta'}
          </button>
        </form>

        <p className="apagado socio-entrar__nota">
          ¿Ya tienes una? <Link to="/socio">Entra con su código</Link>.
        </p>
      </div>
    </section>
  );
}
