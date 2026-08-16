import { useState } from 'react';
import Modal from './Modal.jsx';
import { Boton, Campo, Entrada } from './Campos.jsx';

const manana = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA');
};

const enCorto = (fecha) =>
  new Date(fecha.replace(' ', 'T') + 'Z').toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

/**
 * Marcar un plato como agotado.
 *
 * "Se acabo" es un solo toque, que es el caso de todos los dias y se hace de
 * pie en mitad del servicio. Lo de una temporada esta detras del boton de
 * fecha, porque pasa una vez al mes.
 *
 * No se confunde con quitarlo de la carta: agotado sigue saliendo en la carta
 * publica, tachado. Quitarlo lo esconde del todo.
 */
export default function Agotado({ item, onCambiar, disabled }) {
  const [eligiendoFecha, setEligiendoFecha] = useState(false);
  const [fecha, setFecha] = useState(manana);

  if (item.agotado) {
    return (
      <div className="agotado">
        <span className="etiqueta-mini etiqueta-mini--alerta">
          {item.agotado_hasta ? `vuelve ${enCorto(item.agotado_hasta)}` : 'agotado'}
        </span>
        <button
          type="button"
          className="enlace"
          onClick={() => onCambiar(null)}
          disabled={disabled}
        >
          Hay de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="agotado">
      <button
        type="button"
        className="btn btn--agotar"
        onClick={() => onCambiar('hoy')}
        disabled={disabled}
        title="Se marca agotado y vuelve solo manana"
      >
        Se acabo
      </button>
      <button
        type="button"
        className="mini"
        onClick={() => setEligiendoFecha(true)}
        disabled={disabled}
        title="Agotado hasta una fecha"
        aria-label="Agotado hasta una fecha"
      >
        ⋯
      </button>

      {eligiendoFecha && (
        <Modal
          titulo={`Sin ${item.nombre} hasta cuando?`}
          onCerrar={() => setEligiendoFecha(false)}
          ancho="420px"
          pie={
            <>
              <Boton onClick={() => setEligiendoFecha(false)}>Cancelar</Boton>
              <Boton
                variante="principal"
                onClick={() => {
                  onCambiar(fecha);
                  setEligiendoFecha(false);
                }}
              >
                Marcar agotado
              </Boton>
            </>
          }
        >
          <p className="apagado nota-seccion">
            El plato sigue en la carta, marcado como agotado, y vuelve solo ese dia. Si lo
            que quieres es sacarlo de la carta sin fecha, usa la casilla{' '}
            <strong>En carta</strong>.
          </p>
          <Campo etiqueta="Vuelve el" ayuda="Se restaura solo, no hay que acordarse">
            <Entrada
              type="date"
              value={fecha}
              min={manana()}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Campo>
        </Modal>
      )}
    </div>
  );
}
