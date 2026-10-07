import Logo from './Logo.jsx';

/**
 * La tarjeta, con forma de billete.
 *
 * Sale del billete de Luma que trajo el grupo como referencia: muesca arriba,
 * sello a la izquierda, dato de cabecera a la derecha, nombre grande, campos
 * con su rotulo pequeno y el QR abajo en un recuadro blanco. Los colores son
 * los de la casa.
 *
 * Lo que se cambia de aquella referencia es lo que aqui tiene otro trabajo: en
 * medio van OCHO SELLOS. Un numero -"5 de 8"- se lee; ocho huecos de los que
 * cinco estan llenos se ve, y se ve desde lejos y de reojo mientras uno guarda
 * el movil.
 *
 * Esta separada del perfil porque es lo unico que se ensena en la puerta: el
 * dia que haya que poderla guardar en la cartera del movil, lo que se exporta
 * es esto y no la pagina entera.
 */
export default function TarjetaSocio({ tarjeta }) {
  const sellos = Array.from({ length: tarjeta.visitasParaElPremio }, (_, i) => {
    // Con un premio pendiente, la fila se ensena ENTERA llena: es la foto de
    // "lo has conseguido". Si se pintara el tramo nuevo a cero, parece que se
    // ha perdido lo andado.
    if (tarjeta.premiosPendientes > 0) return true;
    return i < tarjeta.enElTramo;
  });

  const desde = new Date(tarjeta.socioDesde).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const enElTramo = tarjeta.premiosPendientes > 0 ? tarjeta.visitasParaElPremio : tarjeta.enElTramo;

  return (
    <article
      className={`tarjeta-socio ${tarjeta.premiosPendientes > 0 ? 'tarjeta-socio--premiada' : ''}`}
    >
      {/* La muesca. Es lo que hace que se lea como un billete y no como una
          caja de texto; va en el CSS, no en una imagen. */}
      <span className="tarjeta-socio__muesca" aria-hidden="true" />

      <header className="tarjeta-socio__cabecera">
        <Logo descriptor="SOCIO" />
        <p className="tarjeta-socio__desde">
          <span>SOCIO DESDE</span>
          <strong>{desde}</strong>
        </p>
      </header>

      <h2 className="tarjeta-socio__nombre">{tarjeta.nombre}</h2>

      <div
        className="sellos-visita"
        role="img"
        aria-label={`${enElTramo} de ${tarjeta.visitasParaElPremio} visitas en este tramo`}
      >
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
      </dl>

      {/* El QR va con `dangerouslySetInnerHTML` porque la API lo manda como SVG
          ya dibujado: lo genera la libreria de codigos del servidor, no es
          nada escrito por un usuario. */}
      <div className="tarjeta-socio__qr" dangerouslySetInnerHTML={{ __html: tarjeta.qr }} />

      <p className="tarjeta-socio__pie">Válida en las cuatro casas del grupo</p>
    </article>
  );
}
