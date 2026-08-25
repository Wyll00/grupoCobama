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
 *
 * Los dos campos son independientes. Antes la funcion entera salia por la
 * puerta si no habia titulo, asi que una pagina que solo quisiera poner
 * descripcion no ponia ninguna de las dos y no avisaba de nada. Se noto al
 * quitar los titulos por pagina: la pestana quedo bien y las descripciones
 * desaparecieron todas de golpe.
 */
export function useMetadatos({ titulo, descripcion }) {
  useEffect(() => {
    if (!titulo) return undefined;

    const anterior = document.title;
    document.title = titulo;

    return () => {
      document.title = anterior;
    };
  }, [titulo]);

  useEffect(() => {
    if (!descripcion) return undefined;

    let etiqueta = document.querySelector('meta[name="description"]');
    let creada = false;

    if (!etiqueta) {
      etiqueta = document.createElement('meta');
      etiqueta.setAttribute('name', 'description');
      document.head.appendChild(etiqueta);
      creada = true;
    }

    const anterior = etiqueta.getAttribute('content');
    etiqueta.setAttribute('content', descripcion);

    return () => {
      // Si la etiqueta la creamos aqui, se va entera: dejarla vacia en el
      // head no describe nada y confunde al siguiente que la busque.
      if (creada) etiqueta.remove();
      else if (anterior != null) etiqueta.setAttribute('content', anterior);
    };
  }, [descripcion]);
}
