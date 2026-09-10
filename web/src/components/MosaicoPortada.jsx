import { ui } from '../datos/idioma.js';
import { useIdioma } from '../hooks/useIdioma.js';

/**
 * Las fotos de comida de la portada.
 *
 * Tres platos, no uno: una sola foto grande obliga a elegir entre el guiso,
 * la brasa y lo de picar, y esta casa vive de las tres cosas. Con tres se ve
 * de un vistazo de que va la cocina sin bajar a las tarjetas.
 *
 * SON FOTOS DE EJEMPLO. Las puso el grupo para ver la portada terminada, y se
 * cambian sustituyendo los ficheros de web/public/portada. Para prepararlas
 * desde los originales:
 *
 *   node scripts/fotos-portada.mjs <carpeta con los originales>   (en api/)
 *
 * Ese script las recorta a la proporcion de cada hueco y las saca en WebP a
 * dos tamanos. Los originales son PNG de tres megas: puestos tal cual serian
 * nueve megas antes de que se lea la primera palabra, y esta es la pagina que
 * mas se abre desde el movil.
 *
 * Los nombres de los platos salen del diccionario y estan copiados de los que
 * ya tienen esos mismos platos en la carta: si en la carta pone "Grilled
 * cheese with mojo sauce", aqui no puede poner otra cosa.
 */

const PIEZAS = [
  {
    fichero: 'papas-arrugadas',
    clave: 'portada.papas',
    ancho: 760,
    alto: 950,
    // La grande carga con prioridad: es la imagen mas grande de la primera
    // pantalla, o sea la que decide cuando el navegador considera que la
    // pagina ya se ve.
    principal: true,
  },
  { fichero: 'queso-asado', clave: 'portada.queso', ancho: 620, alto: 560 },
  { fichero: 'carne-de-cabra', clave: 'portada.cabra', ancho: 620, alto: 560 },
];

export default function MosaicoPortada() {
  const [idioma] = useIdioma();

  return (
    <div className="mosaico">
      {PIEZAS.map(({ fichero, clave, ancho, alto, principal }) => {
        const nombre = ui(clave, idioma);

        return (
          <figure
            key={fichero}
            className={`mosaico__pieza ${principal ? 'mosaico__pieza--grande' : ''}`}
          >
            <img
              src={`/portada/${fichero}.webp`}
              srcSet={`/portada/${fichero}.webp 1x, /portada/${fichero}@2x.webp 2x`}
              width={ancho}
              height={alto}
              // El alt dice el plato, no "foto de comida": quien navega con
              // lector de pantalla se lleva la misma informacion que quien la
              // ve, que es de que se come aqui.
              alt={nombre}
              loading={principal ? 'eager' : 'lazy'}
              // En minuscula a proposito: React 18 no conoce `fetchPriority`
              // en camelCase y lo tiraria con un aviso por consola.
              fetchpriority={principal ? 'high' : 'auto'}
              decoding="async"
            />
            <figcaption className="mosaico__nombre">{nombre}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}
