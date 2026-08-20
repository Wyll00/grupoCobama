import { Link } from 'react-router-dom';
import { LEGAL, camposPendientes } from '../datos/legal.js';
import { GRUPO } from '../datos/grupo.js';
import { useMetadatos } from '../hooks/useMetadatos.js';

/**
 * Aviso legal.
 *
 * Lo exige la LSSI-CE art. 10 en cuanto una web es de una empresa y ofrece
 * algo, aunque no se venda nada online: hay que poder saber quien esta detras
 * del sitio y donde reclamar.
 */
export default function AvisoLegal() {
  useMetadatos({
    titulo: 'Aviso legal · Grupo Cobama',
    descripcion: 'Titular del sitio, condiciones de uso y responsabilidades.',
  });

  return (
    <section className="seccion">
      <div className="contenedor legal">
        <h1>Aviso legal</h1>

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

        <h2>Quien es el titular de esta web</h2>
        <ul className="legal__datos">
          <li>
            <strong>Titular:</strong> {LEGAL.razonSocial}
          </li>
          <li>
            <strong>NIF:</strong> {LEGAL.nif}
          </li>
          <li>
            <strong>Domicilio:</strong> {LEGAL.domicilio}
          </li>
          <li>
            <strong>Email:</strong> <a href={`mailto:${GRUPO.email}`}>{GRUPO.email}</a>
          </li>
          <li>
            <strong>Telefono:</strong> {GRUPO.whatsapp}
          </li>
          {LEGAL.registro && (
            <li>
              <strong>Datos registrales:</strong> {LEGAL.registro}
            </li>
          )}
        </ul>

        <h2>Para que sirve este sitio</h2>
        <p>
          Aqui se publican las cartas, los horarios y la informacion de los locales del{' '}
          {GRUPO.nombre}, y se pueden solicitar reservas de mesa. No se vende nada por
          internet ni se cobra nada a traves de la web.
        </p>

        <h2>Las reservas son solicitudes</h2>
        <p>
          Pedir mesa desde la web es una <strong>solicitud</strong>, no una reserva cerrada.
          Queda confirmada cuando el local te lo comunica. Hasta ese momento no hay mesa
          garantizada, y el local puede no poder atenderla si no queda sitio a esa hora.
        </p>

        <h2>La carta y los precios</h2>
        <p>
          Los platos, precios e informacion de alergenos se actualizan a menudo y pueden
          cambiar sin previo aviso. La carta que manda es la del local. Si tienes una
          alergia o una intolerancia, <strong>diselo siempre al personal de sala</strong>:
          la cocina es compartida y la web no puede descartar la contaminacion cruzada.
        </p>

        <h2>Propiedad intelectual</h2>
        <p>
          Los textos, fotografias, logotipos y el diseno de este sitio pertenecen a su
          titular o se usan con permiso. Puedes compartir enlaces libremente, pero no
          reproducir el contenido con fines comerciales sin autorizacion.
        </p>

        <h2>Enlaces a otros sitios</h2>
        <p>
          Esta web enlaza a servicios de terceros (mapas, redes sociales, WhatsApp). No
          controlamos esos sitios ni respondemos de su contenido ni de como tratan tus
          datos: cuando sales de aqui, se aplican sus propias condiciones.
        </p>

        <h2>Responsabilidad</h2>
        <p>
          Ponemos cuidado en que la informacion este al dia, pero no podemos garantizar que
          en todo momento este libre de errores. Si ves algo mal, avisanos a{' '}
          <a href={`mailto:${GRUPO.email}`}>{GRUPO.email}</a> y lo corregimos.
        </p>

        <h2>Ley aplicable</h2>
        <p>
          Se aplica la legislacion espanola. Para cualquier conflicto, seran competentes los
          juzgados que correspondan segun la ley; si eres consumidor, los de tu domicilio.
        </p>

        <p className="legal__pie">
          Ver tambien la <Link to="/privacidad">politica de privacidad</Link>.
        </p>
      </div>
    </section>
  );
}
