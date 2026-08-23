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
 * foto y sin foto queda como un hueco, asi que cuando no la hay se pinta el
 * numero de la carta de papel en un disco. No es un relleno: es justo lo que
 * hace falta para pedirlo ("ponme el 54"), asi que la tarjeta sigue sirviendo
 * de algo. Cuando haya foto, manda la foto.
 */
export default function Recomendados({ local, platos }) {
  if (!platos || platos.length === 0) return null;

  return (
    <section className="seccion seccion--recomendados">
      <div className="contenedor">
        <div className="seccion__cabecera">
          <div>
            <h2>Lo que recomienda la casa</h2>
            <p className="apagado" style={{ maxWidth: '54ch' }}>
              Los arroces y las carnes que mejor salen de esta cocina.
            </p>
          </div>
          <Link className="boton boton--secundario" to={`/${local.slug}/carta`}>
            Ver la carta entera
          </Link>
        </div>

        <Carrusel total={platos.length} queSon="recomendaciones" className="carrusel--fichas">
          {platos.map((plato) => (
            <li key={plato.carta_item_id}>
              <article className="ficha-plato">
                <div className="ficha-plato__medallon">
                  {plato.imagen_thumb ? (
                    <img src={plato.imagen_thumb} alt="" loading="lazy" decoding="async" />
                  ) : (
                    // Sin numero de carta (las otras casas todavia no lo
                    // tienen) va la inicial del plato. Un punto suelto en un
                    // disco de 6 rem se ve como un fallo de carga.
                    <span className="ficha-plato__numero">
                      {plato.numero_carta ?? plato.nombre.trim()[0].toUpperCase()}
                    </span>
                  )}
                </div>

                <p className="ficha-plato__seccion">
                  {plato.categoria_nombre}
                  {UNIDAD[plato.unidad] && ` · ${UNIDAD[plato.unidad]}`}
                </p>

                <h3 className="ficha-plato__nombre">{plato.nombre}</h3>

                {plato.descripcion && (
                  <p className="ficha-plato__desc">{plato.descripcion}</p>
                )}

                <div className="ficha-plato__pie">
                  <span className="ficha-plato__precio">
                    {formatoPrecio.format(plato.precio)}
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
