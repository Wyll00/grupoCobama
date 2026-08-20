import { useState } from 'react';
import { adminApi, ErrorApi } from '../api.js';

/**
 * Estado del envio de la reserva a CoverManager.
 *
 * Solo aparece cuando hay algo que contar. Un local que no usa CoverManager
 * queda en 'no_aplica' y aqui no se pinta nada: llenar la tabla de avisos
 * grises en los tres locales que no lo tienen haria que sala dejara de mirar
 * los del que si.
 *
 * Lo que de verdad importa es 'error'. Significa que la reserva existe aqui
 * pero NO esta en el libro de CoverManager, o sea que esa mesa no esta
 * bloqueada y se puede vender dos veces. Tiene que verse desde lejos.
 */
const TEXTOS = {
  pendiente: { etiqueta: 'Enviando...', clase: 'cm--pendiente' },
  enviando: { etiqueta: 'Enviando...', clase: 'cm--pendiente' },
  enviada: { etiqueta: 'En CoverManager', clase: 'cm--ok' },
  error: { etiqueta: 'NO esta en CoverManager', clase: 'cm--error' },
};

export default function EstadoCoverManager({ reserva, onCambio }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const info = TEXTOS[reserva.cm_estado];
  if (!info) return null;

  const reenviar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await adminApi.reenviarCoverManager(reserva.id);
      onCambio?.();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se ha podido reenviar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={`cm ${info.clase}`}>
      <span className="cm__etiqueta">{info.etiqueta}</span>

      {reserva.cm_estado === 'error' && (
        <>
          {reserva.cm_ultimo_error && (
            <span className="cm__detalle" title={reserva.cm_ultimo_error}>
              {reserva.cm_ultimo_error}
            </span>
          )}
          <button type="button" className="enlace" onClick={reenviar} disabled={enviando}>
            {enviando ? 'Reintentando...' : 'Reintentar'}
          </button>
        </>
      )}

      {error && <span className="cm__detalle">{error}</span>}
    </div>
  );
}
