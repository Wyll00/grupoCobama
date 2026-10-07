import { useEffect } from 'react';

/**
 * Cambia el manifiesto de la pagina mientras el componente esta montado.
 *
 * El manifiesto es lo que decide QUE se guarda cuando alguien le da a
 * "anadir a pantalla de inicio": el nombre que sale debajo del icono y,
 * sobre todo, en que direccion abre. Hay uno para el sitio y otro para la
 * tarjeta, y cual de los dos esta puesto depende de donde este el visitante
 * en ese momento.
 *
 * ---------------------------------------------------------------------------
 * EL MANIFIESTO DE LA TARJETA LLEVA EL CODIGO DENTRO, y lo sirve la API: uno
 * por socio, en /api/socios/CODIGO/manifiesto.webmanifest.
 *
 * Aqui ponia un manifiesto fijo que abria en /socio, contando con que el
 * navegador recordase el codigo. No funciono: en un iPhone, guardar la web en
 * la pantalla de inicio y tocar el icono abria la PORTADA. Lo conto el dueno
 * despues de probarlo en su movil, que es donde se ve esto y no en un
 * navegador de escritorio.
 *
 * Con la direccion metida en el manifiesto da igual quien tenga razon sobre
 * que hace iOS -si usa `start_url` o la pagina que esta abierta-, porque las
 * dos llevan al mismo sitio cuando se guarda desde la propia tarjeta. Y de
 * paso deja de depender de que el icono comparta almacenamiento con el
 * navegador, que en iOS no esta garantizado.
 * ---------------------------------------------------------------------------
 */
export function useManifiesto(href) {
  useEffect(() => {
    const etiqueta = document.querySelector('link[rel="manifest"]');
    if (!etiqueta) return undefined;

    const anterior = etiqueta.getAttribute('href');
    if (anterior === href) return undefined;

    etiqueta.setAttribute('href', href);

    // Al salir se devuelve el del sitio. Si no, quien mire su tarjeta y luego
    // navegue a la carta seguiria con el manifiesto de la tarjeta puesto.
    return () => etiqueta.setAttribute('href', anterior);
  }, [href]);
}
