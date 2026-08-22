import { useEffect, useRef } from 'react';

/**
 * Visor a pantalla completa para la galeria.
 *
 * Teclado ademas de raton: flechas para pasar y Escape para salir. Una
 * galeria que solo se maneja pulsando flechitas diminutas deja fuera a quien
 * navega con el teclado, y en escritorio es ademas lo comodo.
 */
export default function Visor({ fotos, indice, onCerrar, onCambiar }) {
  const foco = useRef(null);
  const foto = fotos[indice];

  useEffect(() => {
    const alPulsar = (e) => {
      if (e.key === 'Escape') onCerrar();
      if (e.key === 'ArrowRight') onCambiar((indice + 1) % fotos.length);
      if (e.key === 'ArrowLeft') onCambiar((indice - 1 + fotos.length) % fotos.length);
    };
    window.addEventListener('keydown', alPulsar);

    // Sin esto, la pagina de detras sigue desplazandose con la rueda mientras
    // el visor esta abierto: se cierra y te has perdido el sitio donde ibas.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    foco.current?.focus();

    return () => {
      window.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflow;
    };
  }, [indice, fotos.length, onCerrar, onCambiar]);

  if (!foto) return null;

  return (
    <div
      className="visor"
      role="dialog"
      aria-modal="true"
      aria-label={foto.alt ?? foto.titulo ?? 'Foto ampliada'}
      // Cerrar al pulsar el fondo, pero no al pulsar la foto: si no, arrastrar
      // para verla bien la cierra sin querer.
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <button
        type="button"
        className="visor__cerrar"
        onClick={onCerrar}
        ref={foco}
        aria-label="Cerrar"
      >
        ✕
      </button>

      {fotos.length > 1 && (
        <button
          type="button"
          className="visor__flecha visor__flecha--atras"
          onClick={() => onCambiar((indice - 1 + fotos.length) % fotos.length)}
          aria-label="Foto anterior"
        >
          ‹
        </button>
      )}

      <figure className="visor__figura">
        <img
          src={foto.imagen}
          alt={foto.alt ?? ''}
          width={foto.ancho}
          height={foto.alto}
        />
        {(foto.titulo || foto.restaurante_nombre) && (
          <figcaption>
            {foto.titulo}
            {foto.titulo && foto.restaurante_nombre && ' · '}
            {foto.restaurante_nombre}
          </figcaption>
        )}
      </figure>

      {fotos.length > 1 && (
        <button
          type="button"
          className="visor__flecha visor__flecha--adelante"
          onClick={() => onCambiar((indice + 1) % fotos.length)}
          aria-label="Foto siguiente"
        >
          ›
        </button>
      )}

      <div className="visor__cuenta">
        {indice + 1} / {fotos.length}
      </div>
    </div>
  );
}
