import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { Cargando, Error } from '../components/Estado.jsx';
import Logo from '../components/Logo.jsx';

/**
 * La tarjeta de socio, tal y como la ve el cliente en su movil.
 *
 * Tiene forma de billete -con su muesca arriba- porque es lo que es: algo que
 * se ensena en la puerta. El esquema sale del billete de Luma que trajo el
 * grupo como referencia: sello arriba a la izquierda, el dato de cabecera a la
 * derecha, el titulo grande, los campos con su rotulo pequeno y el QR abajo en
 * un recuadro blanco.
 *
 * Lo que se cambia de aquella referencia es lo que aqui tiene otro trabajo:
 *
 *  - Los colores son los de la casa, no los de Luma.
 *  - En medio van OCHO SELLOS, que es lo que de verdad se viene a mirar. Un
 *    numero -"5 de 8"- se lee; ocho huecos de los que cinco estan llenos se
 *    ve, y se ve desde lejos y de reojo mientras uno guarda el movil.
 */

export default function Socio() {
  const { codigo } = useParams();
  const { datos: tarjeta, cargando, error } = useApi(
    (opts) => api.socio(codigo, opts),
    [codigo]
  );

  if (error) return <Error error={error} />;
  if (cargando) return <Cargando texto="Abriendo la tarjeta..." />;

  const sellos = Array.from({ length: tarjeta.visitasParaElPremio }, (_, i) => {
    // Con un premio pendiente, la fila se ensena ENTERA llena: es la foto de
    // "lo has conseguido". Si se pintara el resto 0 de 8 por haber empezado
    // tramo nuevo, parece que se ha perdido lo andado.
    if (tarjeta.premiosPendientes > 0) return true;
    return i < tarjeta.enElTramo;
  });

  const desde = new Date(tarjeta.socioDesde).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <section className="seccion socio">
      <article className={`tarjeta-socio ${tarjeta.premiosPendientes > 0 ? 'tarjeta-socio--premiada' : ''}`}>
        {/* La muesca de arriba. Es lo que hace que se lea como un billete y no
            como una caja de texto; va en el CSS, no en una imagen. */}
        <span className="tarjeta-socio__muesca" aria-hidden="true" />

        <header className="tarjeta-socio__cabecera">
          <Logo descriptor="SOCIO" />
          <p className="tarjeta-socio__desde">
            <span>SOCIO DESDE</span>
            <strong>{desde}</strong>
          </p>
        </header>

        <h1 className="tarjeta-socio__nombre">{tarjeta.nombre}</h1>

        {/* Los sellos: lo primero que se mira. */}
        <div className="sellos-visita" role="img" aria-label={`${tarjeta.visitas % tarjeta.visitasParaElPremio || (tarjeta.premiosPendientes ? tarjeta.visitasParaElPremio : 0)} de ${tarjeta.visitasParaElPremio} visitas en este tramo`}>
          {sellos.map((lleno, i) => (
            <span key={i} className={`sello-visita ${lleno ? 'sello-visita--lleno' : ''}`} />
          ))}
        </div>

        {tarjeta.premiosPendientes > 0 ? (
          <p className="tarjeta-socio__premio">
            <strong>¡Tienes un premio!</strong>
            <span>Enséñale esta tarjeta a quien te atienda.</span>
          </p>
        ) : (
          <p className="tarjeta-socio__faltan">
            {tarjeta.faltan === 1
              ? 'Te falta 1 visita para tu premio'
              : `Te faltan ${tarjeta.faltan} visitas para tu premio`}
          </p>
        )}

        <dl className="tarjeta-socio__datos">
          <div>
            <dt>TARJETA</dt>
            <dd className="tarjeta-socio__codigo">{tarjeta.codigo}</dd>
          </div>
          <div>
            <dt>VISITAS</dt>
            <dd>{tarjeta.visitas}</dd>
          </div>
          {tarjeta.altaEn && (
            <div>
              <dt>TE HICISTE SOCIO EN</dt>
              <dd>{tarjeta.altaEn.nombre}</dd>
            </div>
          )}
          {tarjeta.premiosGanados > 0 && (
            <div>
              <dt>PREMIOS</dt>
              <dd>{tarjeta.premiosGanados}</dd>
            </div>
          )}
        </dl>

        {/* El QR, en su recuadro blanco. Va con `dangerouslySetInnerHTML`
            porque la API lo manda como SVG ya dibujado: lo genera la libreria
            de códigos del servidor, no es nada escrito por un usuario. */}
        <div className="tarjeta-socio__qr" dangerouslySetInnerHTML={{ __html: tarjeta.qr }} />

        <p className="tarjeta-socio__pie">
          Válida en las cuatro casas del grupo
        </p>
      </article>

      {tarjeta.historial.length > 0 && (
        <div className="contenedor socio__historial">
          <h2>Tus visitas</h2>
          <ul>
            {tarjeta.historial.map((v) => (
              <li key={v.id}>
                <span className="socio__historial-fecha">
                  {new Date(`${v.fecha}T12:00:00Z`).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
                <span className="socio__historial-local">{v.local}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
