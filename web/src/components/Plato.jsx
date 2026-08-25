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

          {/*
            Los alergenos, junto al nombre y no debajo de la descripcion.

            Los que tienen dibujo van SOLO con el dibujo: doce de los catorce
            lo tienen y con el nombre al lado ocupaban tres renglones bajo
            cada plato. El nombre no se pierde, se mueve al alt y al title,
            asi que un lector de pantalla lo dice y el raton por encima lo
            enseña.

            Gluten y mostaza siguen sin dibujo -y gluten sale en 38 platos,
            que no es poco-, asi que esos van escritos. Si un dibujo falta, el
            alergeno se ve igual: es lo unico que no se puede negociar aqui.

            Y si es TRAZA, el texto se queda aunque haya dibujo. "Contiene" y
            "puede contener trazas" no son lo mismo para quien tiene la
            alergia, y esa diferencia un dibujo no la sabe decir.
          */}
          {plato.alergenos.length > 0 && (
            <span
              className="alergenos"
              role="list"
              aria-label={`Alergenos de ${plato.nombre}`}
            >
              {plato.alergenos.map((a) => {
                const soloDibujo = Boolean(a.icono) && !a.trazas;
                return (
                  <span
                    key={a.id}
                    role="listitem"
                    className={`alergeno ${soloDibujo ? 'alergeno--dibujo' : ''}`}
                  >
                    <IconoAlergeno alergeno={a} nombre={soloDibujo ? a.nombre : null} />
                    {!soloDibujo && (
                      <span>
                        {a.nombre}
                        {a.trazas && ' (trazas)'}
                      </span>
                    )}
                  </span>
                );
              })}
            </span>
          )}
        </div>

        {plato.descripcion && <p className="plato__descripcion">{plato.descripcion}</p>}
      </div>

      {/*
        La media va a la IZQUIERDA del precio, no encima.

        Encima competia con el importe por el mismo sitio y empujaba hacia
        arriba la linea de "por persona · min. 2", que es la que no se puede
        perder de vista. Al lado, las dos cifras se leen de un golpe -media y
        entera- y debajo del importe queda libre el renglon de la condicion.

        El importe y su condicion van juntos en su propia columna para que la
        condicion cuelgue del numero grande y no de la media: es del precio de
        la racion de lo que habla.
      */}
      <div className="plato__precio">
        {plato.precio_media !== null && plato.precio_media !== undefined && (
          <span className="plato__media">
            {/* La palabra solo hace falta cuando no hay cabezal de columna,
                o sea en movil, donde las dos cifras van apiladas. Arriba, con
                "Media racion" escrito sobre la columna, repetirla en cada
                renglon es ruido. */}
            <span className="plato__media-palabra">media </span>
            {formatoPrecio.format(plato.precio_media)}
          </span>
        )}
        <span className="plato__cifras">
          <span className="plato__importe">{formatoPrecio.format(plato.precio)}</span>
          {condiciones(plato) && <span className="plato__unidad">{condiciones(plato)}</span>}
        </span>
      </div>
    </li>
  );
}
