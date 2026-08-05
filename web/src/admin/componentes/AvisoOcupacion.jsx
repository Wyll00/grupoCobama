import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth.jsx';
import { adminApi, ErrorApi } from '../api.js';

const MINUTO = 60_000;

/**
 * Pregunta horaria de aforo, pensada para el comandero.
 *
 * Aparece fija abajo cuando el local esta abierto y no se ha respondido el
 * tramo en curso. Los botones son grandes a proposito: se pulsan con el dedo,
 * de pie y con prisa.
 *
 * La comprobacion es un sondeo cada minuto en lugar de una notificacion push:
 * push exige HTTPS, claves VAPID y que alguien acepte el permiso en cada
 * dispositivo. Como el comandero tiene el panel abierto durante todo el
 * servicio, el sondeo cubre el caso real. La decision de si toca preguntar la
 * toma la API, asi que anadir push despues no cambia nada de esto.
 */
export default function AvisoOcupacion() {
  const { usuario, localFijo, esAdmin } = useAuth();

  // Un admin de grupo no esta en ninguna sala, asi que no se le pregunta.
  const localId = esAdmin ? null : localFijo;

  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [aplazadoHasta, setAplazadoHasta] = useState(0);
  const [detalle, setDetalle] = useState(false);
  const [comensales, setComensales] = useState('');
  const temporizador = useRef(null);

  const comprobar = useCallback(async () => {
    if (!localId) return;
    try {
      setEstado(await adminApi.ocupacionPendiente(localId));
    } catch {
      // Un fallo de red aqui no debe ensuciar la pantalla: se reintenta solo.
    }
  }, [localId]);

  useEffect(() => {
    if (!localId) return undefined;
    comprobar();
    temporizador.current = setInterval(comprobar, MINUTO);
    return () => clearInterval(temporizador.current);
  }, [localId, comprobar]);

  const responder = async (nivel) => {
    setEnviando(true);
    setError(null);
    try {
      const resultado = await adminApi.registrarOcupacion(localId, {
        nivel,
        comensales: comensales === '' ? null : Number(comensales),
      });
      setEstado(resultado);
      setComensales('');
      setDetalle(false);
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se ha podido guardar');
    } finally {
      setEnviando(false);
    }
  };

  if (!localId || !usuario) return null;
  if (!estado?.toca) return null;
  if (Date.now() < aplazadoHasta) return null;

  const hora = new Date(estado.tramo).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <aside className="aforo" role="status" aria-live="polite">
      <div className="aforo__interior">
        <div className="aforo__texto">
          <strong>Como esta el local ahora?</strong>
          <span className="apagado">Tramo de las {hora}</span>
          {error && <span className="aforo__error">{error}</span>}
        </div>

        <div className="aforo__niveles">
          {estado.niveles.map((n) => (
            <button
              key={n.valor}
              type="button"
              className={`aforo__boton aforo__boton--${n.clave}`}
              onClick={() => responder(n.valor)}
              disabled={enviando}
              title={n.descripcion}
            >
              {n.etiqueta}
            </button>
          ))}
        </div>

        <div className="aforo__extras">
          {detalle ? (
            <input
              className="entrada aforo__comensales"
              type="number"
              min="0"
              max="1000"
              value={comensales}
              onChange={(e) => setComensales(e.target.value)}
              placeholder="Comensales"
              aria-label="Comensales aproximados"
              autoFocus
            />
          ) : (
            <button type="button" className="enlace" onClick={() => setDetalle(true)}>
              Anadir comensales
            </button>
          )}

          {/* Aplazar y no cerrar: el dato de este tramo sigue haciendo falta. */}
          <button
            type="button"
            className="enlace"
            onClick={() => setAplazadoHasta(Date.now() + 10 * MINUTO)}
          >
            Ahora no
          </button>
        </div>
      </div>
    </aside>
  );
}
