import IconoAlergeno from './IconoAlergeno.jsx';
import { useIdioma } from '../hooks/useIdioma.js';
import { texto, ui } from '../datos/idioma.js';

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
const CLAVE_UNIDAD = {
  kg: 'unidad.kg',
  ud: 'unidad.ud',
  persona: 'unidad.persona',
};

/**
 * La linea que va debajo del precio.
 *
 * El minimo de comensales va PEGADO al precio, no en una nota al pie de la
 * seccion. Quien lee "21,00 EUR · por persona" entiende que puede pedirlo
 * solo, y en la mesa le dicen que no: eso no es informacion incompleta, es
 * informacion que induce a error.
 */
function condiciones(plato, idioma) {
  const partes = [];
  const clave = CLAVE_UNIDAD[plato.unidad];
  if (clave) partes.push(ui(clave, idioma));
  if (plato.minimo_personas) {
    partes.push(ui('unidad.minimo', idioma, { n: plato.minimo_personas }));
  }
  return partes.join(' · ');
}

/**
 * Bandera de Canarias, para los platos de la tierra.
 *
 * Tres franjas verticales: blanco, azul y amarillo. Dibujada y no de emoji
 * por lo mismo que las de idioma: Windows no pinta los emoji de bandera, y
 * ademas Canarias no tiene emoji propio -el que existe es el de las islas
 * Canarias como subdivision y casi ningun sistema lo dibuja-.
 *
 * El blanco lleva borde. Sobre el crema de la carta, una franja blanca sin
 * contorno desaparece y la bandera se lee como dos colores, no como tres.
 */
function BanderaCanarias() {
  return (
    <svg
      className="etiqueta__bandera"
      viewBox="0 0 30 20"
      width="21"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="10" height="20" fill="#ffffff" />
      <rect x="10" width="10" height="20" fill="#0072c6" />
      <rect x="20" width="10" height="20" fill="#ffd500" />
      <rect
        x="0.5"
        y="0.5"
        width="29"
        height="19"
        fill="none"
        stroke="rgba(31, 26, 23, 0.35)"
        strokeWidth="1"
      />
    </svg>
  );
}

export default function Plato({ plato }) {
  const [idioma] = useIdioma();
  // Campo a campo y no plato a plato: de 70 platos traducidos solo 30 tienen
  // descripcion, asi que uno a medias sale con el nombre traducido y la
  // descripcion en castellano en vez de con un hueco en blanco.
  const nombre = texto(plato, 'nombre', idioma);
  const descripcion = texto(plato, 'descripcion', idioma);

  return (
    <li className={`plato ${plato.agotado ? 'plato--agotado' : ''}`}>
      <div className="plato__info">
        <div className="plato__nombre">
          {/* El numero del papel. En sala se pide "ponme el 35", asi que
              tenerlo en el movil evita tener que describir el plato entero. */}
          {plato.numero_carta && <span className="plato__numero">{plato.numero_carta}</span>}
          <span>{nombre}</span>
          {/* Se sigue enseñando en lugar de esconderlo: si desaparece, el
              cliente lo pide igual porque lo vio ayer. */}
          {plato.agotado && <span className="etiqueta etiqueta--agotado">{ui('etiqueta.agotado', idioma)}</span>}
          {plato.destacado && !plato.agotado && (
            <span className="etiqueta etiqueta--destacado">{ui('etiqueta.destacado', idioma)}</span>
          )}
          {plato.es_vegano ? (
            <span className="etiqueta etiqueta--veg">{ui('etiqueta.vegano', idioma)}</span>
          ) : plato.es_vegetariano ? (
            <span className="etiqueta etiqueta--veg">{ui('etiqueta.vegetariano', idioma)}</span>
          ) : null}

          {/* Producto canario. La bandera sola, como los alergenos: el nombre
              va en el title y en el texto para lectores de pantalla, que tres
              franjas de color no se leen en voz alta. */}
          {plato.es_canario && (
            <span className="etiqueta etiqueta--canario" title={ui('etiqueta.canario', idioma)}>
              <BanderaCanarias />
              <span className="solo-lectores">{ui('etiqueta.canario', idioma)}</span>
            </span>
          )}

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
              aria-label={`Alergenos de ${nombre}`}
            >
              {plato.alergenos.map((a) => {
                const soloDibujo = Boolean(a.icono) && !a.trazas;
                const nombreAlergeno = texto(a, 'nombre', idioma);
                return (
                  <span
                    key={a.id}
                    role="listitem"
                    className={`alergeno ${soloDibujo ? 'alergeno--dibujo' : ''}`}
                  >
                    <IconoAlergeno alergeno={a} nombre={soloDibujo ? nombreAlergeno : null} />
                    {!soloDibujo && (
                      <span>
                        {nombreAlergeno}
                        {a.trazas && ` (${ui('alergeno.trazas', idioma)})`}
                      </span>
                    )}
                  </span>
                );
              })}
            </span>
          )}
        </div>

        {descripcion && <p className="plato__descripcion">{descripcion}</p>}
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
          {condiciones(plato, idioma) && (
            <span className="plato__unidad">{condiciones(plato, idioma)}</span>
          )}
        </span>
      </div>
    </li>
  );
}
