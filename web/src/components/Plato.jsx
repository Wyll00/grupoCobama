import { lazy, Suspense, useState } from 'react';

// El visor arrastra model-viewer, que son unos 300 KB: solo se carga cuando
// alguien pulsa el boton.
const VerEnMesa = lazy(() => import('./VerEnMesa.jsx'));

const formatoPrecio = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export default function Plato({ plato }) {
  const [enMesa, setEnMesa] = useState(false);

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

        {plato.ver_en_mesa && (
          <button type="button" className="plato__ver-mesa" onClick={() => setEnMesa(true)}>
            Ver en mi mesa
            {plato.ancho_cm && <span className="apagado"> · {plato.ancho_cm} cm</span>}
          </button>
        )}

        {enMesa && (
          <Suspense fallback={null}>
            <VerEnMesa plato={plato} onCerrar={() => setEnMesa(false)} />
          </Suspense>
        )}

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
