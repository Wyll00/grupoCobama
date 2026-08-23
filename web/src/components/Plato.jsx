import IconoAlergeno from './IconoAlergeno.jsx';

const formatoPrecio = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

/**
 * Que significa el precio.
 *
 * Lo mas importante de la ficha despues del numero. Un chuleton a 47,00 EUR
 * sin el "por kg" no es un precio incompleto: es un precio equivocado, porque
 * quien lo lee entiende que ese es el plato y le llega una cuenta al doble.
 * Igual con los arroces, que van por persona y con un minimo de dos.
 */
const UNIDAD = {
  kg: 'el kilo',
  ud: 'la unidad',
  persona: 'por persona',
};

/**
 * La linea que va debajo del precio.
 *
 * El minimo de comensales va PEGADO al precio, no en una nota al pie de la
 * seccion. Quien lee "21,00 EUR · por persona" entiende que puede pedirlo
 * solo, y en la mesa le dicen que no: eso no es informacion incompleta, es
 * informacion que induce a error.
 */
function condiciones(plato) {
  const partes = [];
  if (UNIDAD[plato.unidad]) partes.push(UNIDAD[plato.unidad]);
  if (plato.minimo_personas) partes.push(`min. ${plato.minimo_personas} personas`);
  return partes.join(' · ');
}

export default function Plato({ plato }) {
  return (
    <li className={`plato ${plato.agotado ? 'plato--agotado' : ''}`}>
      <div className="plato__info">
        <div className="plato__nombre">
          {/* El numero del papel. En sala se pide "ponme el 35", asi que
              tenerlo en el movil evita tener que describir el plato entero. */}
          {plato.numero_carta && <span className="plato__numero">{plato.numero_carta}</span>}
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

      <div className="plato__precio">
        {plato.precio_media !== null && plato.precio_media !== undefined && (
          <span className="plato__media">
            media {formatoPrecio.format(plato.precio_media)}
          </span>
        )}
        <span className="plato__importe">{formatoPrecio.format(plato.precio)}</span>
        {condiciones(plato) && <span className="plato__unidad">{condiciones(plato)}</span>}
      </div>
    </li>
  );
}
