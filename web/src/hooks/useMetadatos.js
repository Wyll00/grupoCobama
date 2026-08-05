import { useEffect } from 'react';

/**
 * Ajusta el titulo y la descripcion de la pagina.
 *
 * Importante para lo que NO hace: esto se ejecuta en el navegador, asi que
 * arregla la pestana, el historial y lo que guarda el usuario en favoritos,
 * pero NO la vista previa al pegar el enlace en WhatsApp o Instagram. Esos
 * rastreadores no ejecutan JavaScript: leen el HTML tal cual sale del
 * servidor, y ahi solo esta el index.html generico.
 *
 * La vista previa por local necesita prerenderizado en el despliegue (una
 * funcion de Cloudflare Pages que sirva las etiquetas Open Graph segun la
 * ruta). Va en la fase 4, con el dominio ya decidido.
 */
export function useMetadatos({ titulo, descripcion }) {
  useEffect(() => {
    if (!titulo) return undefined;

    const anterior = document.title;
    document.title = titulo;

    let etiqueta = document.querySelector('meta[name="description"]');
    const descripcionAnterior = etiqueta?.getAttribute('content');

    if (descripcion) {
      if (!etiqueta) {
        etiqueta = document.createElement('meta');
        etiqueta.setAttribute('name', 'description');
        document.head.appendChild(etiqueta);
      }
      etiqueta.setAttribute('content', descripcion);
    }

    return () => {
      document.title = anterior;
      if (descripcion && etiqueta && descripcionAnterior != null) {
        etiqueta.setAttribute('content', descripcionAnterior);
      }
    };
  }, [titulo, descripcion]);
}
