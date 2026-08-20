import IconoAlergeno from './IconoAlergeno.jsx';

const formatoPrecio = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export default function Plato({ plato }) {
  return (
    <li className={`plato ${plato.agotado ? 'plato--agotado' : ''}`}>
      <div className="plato__info">
        <div className="plato__nombre">
          <span>{plato.nombre}</span>
          {/* Se sigue enseñando en lugar de esconderlo: si desaparece, el
              cliente lo pide igual porque lo vio ayer. */}
          {plato.agotado && <span className="etiqueta etiqueta--agotado">Hoy no queda</span>}
          {plato.destacado && !plato.agotado && (
            <span className="etiqueta etiqueta--destacado">De la casa</span>
          )}
          {plato.es_vegano ? (
            <span className="etiqueta etiqueta--veg">Vegano</span>
          ) : plato.es_vegetariano ? (
            <span className="etiqueta etiqueta--veg">Vegetariano</span>
          ) : null}
        </div>

        {plato.descripcion && <p className="plato__descripcion">{plato.descripcion}</p>}

        {plato.alergenos.length > 0 && (
          <ul className="alergenos" aria-label={`Alergenos de ${plato.nombre}`}>
            {plato.alergenos.map((a) => (
              <li key={a.id} className="alergeno">
                <IconoAlergeno alergeno={a} />
                <span>
                  {a.nombre}
                  {a.trazas && ' (trazas)'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="plato__precio">{formatoPrecio.format(plato.precio)}</div>
    </li>
  );
}
