import { useEffect, useState } from 'react';

/** '12.5' -> '12,50' para mostrar; al guardar se admite coma o punto. */
const formatear = (v) => Number(v).toFixed(2).replace('.', ',');

/**
 * Precio editable en linea. Guarda al salir del campo o con Enter, y solo si
 * el valor ha cambiado de verdad: cada guardado escribe en historico_precios.
 */
export default function PrecioEditable({ valor, onGuardar, disabled, etiqueta = 'Precio' }) {
  const [texto, setTexto] = useState(() => formatear(valor));

  useEffect(() => setTexto(formatear(valor)), [valor]);

  const guardar = () => {
    const numero = Number(texto.replace(',', '.'));
    if (!Number.isFinite(numero) || numero < 0 || numero === Number(valor)) {
      setTexto(formatear(valor));
      return;
    }
    onGuardar(numero);
  };

  return (
    <input
      className="entrada entrada--precio"
      inputMode="decimal"
      value={texto}
      disabled={disabled}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setTexto(formatear(valor));
          e.currentTarget.blur();
        }
      }}
      aria-label={etiqueta}
    />
  );
}
