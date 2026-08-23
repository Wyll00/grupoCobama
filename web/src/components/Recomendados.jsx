import { Link } from 'react-router-dom';
import Carrusel from './Carrusel.jsx';

const formatoPrecio = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

/** Que significa el precio. Igual que en la carta: sin esto, engaña. */
const UNIDAD = {
  kg: 'el kilo',
  ud: 'la unidad',
  persona: 'por persona',
};

/**
 * Lo que la casa recomienda, en tarjetas.
 *
 * Salen de `destacado` en la carta del local, el mismo interruptor que ya
 * pinta "De la casa". Si el encargado lo marca aqui aparece, y si lo desmarca
 * desaparece: un segundo sitio donde marcarlo acabaria contradiciendo al
 * primero.
 *
 * EL MEDALLON. De 171 platos, uno tiene foto. Una tarjeta pensada para una
 * foto y sin foto queda como un hueco, asi que mientras no la haya va un
 * dibujo de plato con sus cubiertos. Cuando haya foto, manda la foto.
 */

/**
 * Plato con cubiertos, visto desde arriba.
 *
 * Va en SVG y no como emoji ni imagen: se pinta con el color que herede, asi
 * que sirve igual sobre el disco ocre que sobre cualquier otro fondo, y no
 * es otra peticion al servidor.
 *
 * Los cubiertos son lo que lo hace legible. Un plato solo, visto desde
 * arriba, son dos circulos concentricos, que es exactamente el sello de la
 * marca: se confundirian.
 */
function IconoPlato() {
  return (
    <svg viewBox="0 0 64 64" width="58" height="58" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="32" cy="32" r="15" />
        <circle cx="32" cy="32" r="8" strokeWidth="2" />
        {/* Tenedor: las tres puas por separado. Dibujado como un bloque solido
            se convierte en una mancha en cuanto baja de 40 px. */}
        <path d="M8 10v8M12.5 10v8M17 10v8" />
        <path d="M8 18h9a0 0 0 0 1 0 0c0 2.5-1.6 4-4.5 4S8 20.5 8 18z" />
        <path d="M12.5 22v32" />
        {/* Cuchillo */}
        <path d="M52 10c3 3.5 3.4 9 1 12.6-.6.9-1.6 1.4-2.6 1.4h-.9" />
        <path d="M50.5 24v30" />
      </g>
    </svg>
  );
}

export default function Recomendados({ local, platos }) {
  if (!platos || platos.length === 0) return null;

  return (
    <section className="seccion seccion--recomendados">
      <div className="contenedor">
        <Carrusel
          total={platos.length}
          queSon="recomendaciones"
          className="carrusel--fichas"
          cabecera={
            <>
              <div>
                <h2>Lo que recomienda la casa</h2>
                <p className="apagado" style={{ maxWidth: '54ch' }}>
                  Los arroces y las carnes que mejor salen de esta cocina.
                </p>
              </div>
              <Link className="boton boton--secundario" to={`/${local.slug}/carta`}>
                Ver la carta entera
              </Link>
            </>
          }
        >
          {platos.map((plato) => (
            <li key={plato.carta_item_id}>
              <article className="ficha-plato">
                <div className="ficha-plato__medallon">
                  {plato.imagen_thumb ? (
                    <img src={plato.imagen_thumb} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <IconoPlato />
                  )}
                </div>

                <p className="ficha-plato__seccion">{plato.categoria_nombre}</p>

                <h3 className="ficha-plato__nombre">{plato.nombre}</h3>

                {plato.descripcion && (
                  <p className="ficha-plato__desc">{plato.descripcion}</p>
                )}

                <div className="ficha-plato__pie">
                  <span className="ficha-plato__precio">
                    {formatoPrecio.format(plato.precio)}
                    {/* Pegado al precio y no arriba en la linea de seccion:
                        "21,00 EUR" a secas se entiende como el plato entero, y
                        en la mesa le dicen que va por persona y de dos en dos.
                        Eso no es informacion incompleta, induce a error. */}
                    {(UNIDAD[plato.unidad] || plato.minimo_personas) && (
                      <span className="ficha-plato__condicion">
                        {[UNIDAD[plato.unidad], plato.minimo_personas && `mín. ${plato.minimo_personas} personas`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </span>
                  {/* Solo la media racion. El numero ya esta en el medallon y
                      la unidad en la linea de arriba: repetirlos aqui llena la
                      tarjeta de texto que no anade nada. */}
                  {plato.precio_media && (
                    <span className="ficha-plato__extra">
                      media {formatoPrecio.format(plato.precio_media)}
                    </span>
                  )}
                </div>
              </article>
            </li>
          ))}
        </Carrusel>
      </div>
    </section>
  );
}
