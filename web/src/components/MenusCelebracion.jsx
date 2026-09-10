import { useApi } from '../hooks/useApi.js';
import { api } from '../api/client.js';
import { texto, ui } from '../datos/idioma.js';
import { useIdioma } from '../hooks/useIdioma.js';

const formatoPrecio = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

/**
 * A que se refiere el precio.
 *
 * Igual que el "por kg" del chuleton en la carta: 13,00 EUR a secas en el
 * menu infantil no es un precio incompleto, es un precio equivocado, porque
 * quien lo lee cuenta a todos los de la mesa.
 */
const CLAVE_UNIDAD = { persona: 'unidad.persona', nino: 'unidad.nino' };

/**
 * La linea que acompana al titulo de la seccion.
 *
 * El minimo de comensales sale de los menus, no de un texto escrito a mano:
 * el dia que la casa lo baje a diez, se cambia en la base y la frase cambia
 * sola. Un numero escrito aqui se quedaria diciendo quince para siempre.
 *
 * Solo se pone arriba si TODOS los que tienen minimo piden el mismo. Si cada
 * uno pidiera el suyo, una frase con un solo numero mentiria sobre el resto,
 * asi que en ese caso lo dice cada tarjeta.
 */

function minimoComun(menus) {
  const minimos = new Set(menus.map((m) => m.minimo_comensales).filter(Boolean));
  return minimos.size === 1 ? [...minimos][0] : null;
}

export default function MenusCelebracion({ slug }) {
  const { datos: menus, cargando, error } = useApi((opts) => api.menusCelebracion(slug, opts), [slug]);
  const [idioma] = useIdioma();

  /*
    Sin menus no hay seccion, y no hay hueco donde estuvo.

    Ni mientras carga, ni si la peticion falla, ni si la casa no tiene. Es un
    anadido de la ficha, no su contenido: un titulo "Menus de celebracion"
    sobre un vacio, o un cartel de error donde deberia haber comida, hacen mas
    dano que no ensenar nada. Y hoy solo los tiene La Basilica: las otras tres
    casas no ensenan la seccion en vez de ensenarla vacia.
  */
  if (cargando || error || !menus?.length) return null;

  const minimo = minimoComun(menus);

  return (
    <section className="seccion seccion--menus" aria-labelledby="menus-celebracion">
      <div className="contenedor">
        <div className="seccion__intro">
          <h2 id="menus-celebracion">{ui('menus.titulo', idioma)}</h2>
          <p className="apagado">
            {ui('menus.entradilla', idioma)}
            {minimo ? ` ${ui('menus.minimo', idioma, { n: minimo })}` : ''}
          </p>
        </div>

        <div className="rejilla-menus">
          {menus.map((menu) => (
            <Menu key={menu.id} menu={menu} minimoArriba={Boolean(minimo)} idioma={idioma} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Menu({ menu, minimoArriba, idioma }) {
  return (
    <article className="menu">
      <header className="menu__cabecera">
        <div className="menu__identidad">
          <p className="menu__tipo">{ui('menus.tipo', idioma)}</p>
          <h3>{texto(menu, 'nombre', idioma)}</h3>
          {texto(menu, 'descripcion', idioma) ? (
            <p className="menu__descripcion">{texto(menu, 'descripcion', idioma)}</p>
          ) : null}
        </div>

        {/* El precio dentro del circulo y la unidad debajo, en la misma
            pieza: separarlos deja el numero grande solo y la letra pequena
            se pierde. */}
        <p className="menu__precio">
          <span className="menu__euros">{formatoPrecio.format(menu.precio)}</span>
          <span className="menu__unidad">
            {ui(CLAVE_UNIDAD[menu.unidad_precio] ?? 'unidad.persona', idioma)}
          </span>
        </p>
      </header>

      {/* Solo cuando no cabe en la entradilla de la seccion. Ver minimoComun. */}
      {!minimoArriba && menu.minimo_comensales ? (
        <p className="menu__minimo">{ui('menus.minimo', idioma, { n: menu.minimo_comensales })}</p>
      ) : null}

      {menu.secciones.map((seccion) => (
        <section key={seccion.id} className="menu__seccion">
          <h4>{texto(seccion, 'titulo', idioma)}</h4>
          {texto(seccion, 'nota', idioma) ? (
            <p className="menu__nota">{texto(seccion, 'nota', idioma)}</p>
          ) : null}
          <ul className="menu__lineas">
            {seccion.lineas.map((linea) => (
              <li key={linea.id}>{texto(linea, 'texto', idioma)}</li>
            ))}
          </ul>
        </section>
      ))}

      {texto(menu, 'incluye', idioma) ? (
        <p className="menu__incluye">{texto(menu, 'incluye', idioma)}</p>
      ) : null}
    </article>
  );
}
