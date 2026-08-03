const formatoPrecio = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export default function Plato({ plato }) {
  return (
    <li className="plato">
      <div className="plato__info">
        <div className="plato__nombre">
          <span>{plato.nombre}</span>
          {plato.destacado && <span className="etiqueta etiqueta--destacado">De la casa</span>}
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
                {a.nombre}
                {a.trazas && ' (trazas)'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="plato__precio">{formatoPrecio.format(plato.precio)}</div>
    </li>
  );
}
