import { Link } from 'react-router-dom';
import { LEGAL, VERSION_POLITICA, camposPendientes } from '../datos/legal.js';
import { GRUPO } from '../datos/grupo.js';
import { useMetadatos } from '../hooks/useMetadatos.js';

/**
 * Politica de privacidad.
 *
 * El texto sale de datos/legal.js para que no pueda contradecir ni al aviso
 * del formulario ni al script que borra las reservas viejas. Si el plazo de
 * conservacion cambia en un sitio y no en el otro, la politica pasa a ser
 * falsa, y una politica falsa es peor que no tenerla.
 */
export default function Privacidad() {
  useMetadatos({
    titulo: 'Politica de privacidad · Grupo Cobama',
    descripcion: 'Que datos tratamos, para que, cuanto tiempo y como ejercer tus derechos.',
  });

  const { conservacion, autoridad } = LEGAL;

  return (
    <section className="seccion">
      <div className="contenedor legal">
        <h1>Politica de privacidad</h1>

        {/* A la vista y en produccion tambien, a proposito. Un "PENDIENTE" en
            mitad del aviso legal es feo, pero es justo lo que hace que nadie
            publique esto sin rellenarlo. Un TODO en un comentario no lo ve
            nadie; esto lo ve el primero que abra la pagina. */}
        {camposPendientes().length > 0 && (
          <div className="aviso aviso--error">
            <strong>Sin publicar.</strong> Faltan por rellenar los datos del
            responsable en <code>web/src/datos/legal.js</code>:{' '}
            {camposPendientes().join(', ')}.
          </div>
        )}
        <p className="legal__version">
          Version del {VERSION_POLITICA}. Si la cambiamos, avisamos en esta misma pagina.
        </p>

        <h2>Quien trata tus datos</h2>
        <ul className="legal__datos">
          <li>
            <strong>Responsable:</strong> {LEGAL.razonSocial}
          </li>
          <li>
            <strong>NIF:</strong> {LEGAL.nif}
          </li>
          <li>
            <strong>Domicilio:</strong> {LEGAL.domicilio}
          </li>
          <li>
            <strong>Contacto para privacidad:</strong>{' '}
            <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a>
          </li>
          {LEGAL.delegadoProteccionDatos && (
            <li>
              <strong>Delegado de proteccion de datos:</strong> {LEGAL.delegadoProteccionDatos}
            </li>
          )}
        </ul>

        <h2>Que datos recogemos y para que</h2>
        <p>
          Solo tratamos datos cuando reservas mesa. Navegar por la carta no recoge nada
          tuyo.
        </p>

        <table className="legal__tabla">
          <thead>
            <tr>
              <th>Para que</th>
              <th>Que datos</th>
              <th>Con que base legal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gestionar tu reserva: guardarte la mesa, avisarte y atenderte al llegar</td>
              <td>Nombre, telefono, email si lo das, dia, hora, numero de comensales y lo que nos cuentes en observaciones</td>
              <td>
                <strong>Ejecucion de un contrato</strong> (art. 6.1.b RGPD). Reservar es un
                acuerdo entre tu y el local, asi que no te pedimos permiso para esto: sin
                estos datos no hay reserva posible.
              </td>
            </tr>
            <tr>
              <td>Mandarte novedades, promociones o menus especiales</td>
              <td>Nombre y email</td>
              <td>
                <strong>Tu consentimiento</strong> (art. 6.1.a RGPD), que das marcando la
                casilla correspondiente y que puedes retirar cuando quieras. Es
                voluntario: si no la marcas, tu reserva funciona igual.
              </td>
            </tr>
          </tbody>
        </table>

        <div className="aviso">
          <strong>Cuidado con lo que escribes en observaciones.</strong> Ese campo es libre
          y a veces la gente cuenta ahi una alergia o una condicion medica, que son datos
          de salud y estan especialmente protegidos. Ponlo solo si hace falta para
          atenderte bien; lo usamos unicamente para eso y no lo guardamos mas alla de la
          reserva.
        </div>

        <h2>Cuanto tiempo los guardamos</h2>
        <p>
          Los datos de la reserva se conservan <strong>{conservacion.reservaMeses} meses</strong>{' '}
          desde el dia de la reserva, {conservacion.reservaMotivo}. Pasado ese plazo se
          borran automaticamente.
        </p>
        <p>
          Si nos has dado permiso para mandarte novedades, guardamos tu email{' '}
          {conservacion.marketingMeses
            ? `${conservacion.marketingMeses} meses`
            : 'hasta que nos digas que quieres dejar de recibirlas'}
          .
        </p>

        <h2>Quien mas ve tus datos</h2>
        <p>
          No vendemos ni cedemos tus datos a nadie. Si los ven terceros es porque nos
          prestan un servicio necesario para la reserva, y en ese caso solo pueden usarlos
          para eso:
        </p>
        <ul className="legal__lista">
          {LEGAL.encargados.map((e) => (
            <li key={e.nombre}>
              <strong>{e.nombre}</strong> — {e.para}. Datos tratados en {e.pais}.
            </li>
          ))}
        </ul>
        <p>
          Todos ellos tratan los datos por cuenta nuestra y bajo contrato, sin poder
          usarlos para fines propios.
        </p>

        <h2>Tus derechos</h2>
        <p>
          Puedes pedirnos <strong>acceder</strong> a tus datos, <strong>rectificarlos</strong>{' '}
          si estan mal, <strong>borrarlos</strong>, <strong>limitar</strong> su uso,{' '}
          <strong>oponerte</strong> a que los tratemos y pedir su{' '}
          <strong>portabilidad</strong>. Si nos diste permiso para mandarte novedades,
          puedes <strong>retirarlo</strong> cuando quieras, sin que eso afecte a lo hecho
          antes.
        </p>
        <p>
          Escribe a <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a>{' '}
          diciendo que quieres. Te contestamos como mucho en un mes. Puede que te pidamos
          algo para confirmar que eres tu, porque si no cualquiera podria pedir tus datos.
        </p>
        <p>
          Si crees que no lo hemos hecho bien, puedes reclamar ante la{' '}
          <a href={autoridad.web} target="_blank" rel="noreferrer">
            {autoridad.nombre}
          </a>
          . Nos gustaria que antes nos lo dijeras a nosotros, para poder arreglarlo.
        </p>

        <h2>Cookies</h2>
        <p>
          Esta web <strong>no usa cookies de analitica, de publicidad ni de terceros</strong>,
          asi que no hay ningun banner que aceptar. La unica cookie que existe es la de
          inicio de sesion del panel interno del grupo, que es tecnica e imprescindible
          para que la sesion funcione; los clientes nunca la reciben.
        </p>

        <h2>Cambios</h2>
        <p>
          Si cambiamos esta politica, cambia tambien la version de arriba. Guardamos que
          version estaba vigente cuando hiciste tu reserva, para que siempre se pueda
          saber que texto se te enseno.
        </p>

        <p className="legal__pie">
          Ver tambien el <Link to="/aviso-legal">aviso legal</Link>. Para cualquier otra
          cosa, <a href={`mailto:${GRUPO.email}`}>{GRUPO.email}</a>.
        </p>
      </div>
    </section>
  );
}
