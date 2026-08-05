import { useEffect, useRef } from 'react';

export default function Modal({ titulo, onCerrar, ancho = '640px', children, pie }) {
  const caja = useRef(null);

  useEffect(() => {
    const alPulsar = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    // Bloquea el scroll del fondo mientras el modal esta abierto.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    caja.current?.focus();

    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onCerrar]);

  return (
    <div className="modal__fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div
        className="modal"
        style={{ maxWidth: ancho }}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        ref={caja}
      >
        <header className="modal__cabecera">
          <h2>{titulo}</h2>
          <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="modal__cuerpo">{children}</div>

        {pie && <footer className="modal__pie">{pie}</footer>}
      </div>
    </div>
  );
}
