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
 * Por que `/socio` y no `/socio/EL-CODIGO` en el manifiesto de la tarjeta:
 * `/socio` ya sabe redirigir al codigo que recuerda el navegador, y el icono
 * guardado comparte ese recuerdo porque es el mismo origen. Con el codigo
 * metido a fuego, el icono se quedaria apuntando a una tarjeta vieja el dia
 * que alguien pierda la suya y le hagan otra.
 *
 * ---------------------------------------------------------------------------
 * EN iOS ESTO NO HACE NADA, y es importante saberlo antes de depurarlo:
 * Safari no lee el manifiesto para "anadir a pantalla de inicio". Guarda la
 * direccion que esta abierta en ese momento. Que resulta ser justo lo que se
 * quiere -el cliente esta mirando su tarjeta cuando lo hace-, asi que iOS sale
 * bien sin esto. Esto es para Android, que si lo lee y que si no se le dice lo
 * contrario guardaria la portada.
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
