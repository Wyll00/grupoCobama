import { useState } from 'react';
import { adminApi, ErrorApi } from '../api.js';
import { Boton, Campo, Entrada } from './Campos.jsx';

/**
 * Adonde lleva el boton de reservar de este local.
 *
 * Vacio = al formulario de la web, que es lo de siempre. Con una direccion,
 * el boton se va fuera: al widget de CoverManager, a TheFork, a donde sea.
 *
 * Lo importante es el aviso. Mandar las reservas fuera parece un ajuste sin
 * consecuencias y no lo es: esas reservas dejan de existir en esta aplicacion,
 * asi que desaparecen de la bandeja, no llega el aviso al local y el historico
 * se corta. Puesto asi, es una decision; sin decirlo, es una trampa que se
 * descubre semanas despues cuando alguien busca una reserva que no esta.
 */
export default function ReservasExternas({ local, onCambio }) {
  const [valor, setValor] = useState(local.url_reservas ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [guardado, setGuardado] = useState(false);

  const original = local.url_reservas ?? '';
  const cambiado = valor.trim() !== original;

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    setGuardado(false);
    try {
      await adminApi.editarLocal(local.id, { url_reservas: valor.trim() });
      setGuardado(true);
      onCambio?.();
    } catch (e) {
      // El 400 de validacion trae el motivo concreto en detalles; el mensaje
      // de arriba es generico y no le dice nada a quien esta escribiendo.
      const detalle = e instanceof ErrorApi ? e.detalles.find((d) => d.campo === 'url_reservas') : null;
      setError(detalle?.mensaje ?? (e instanceof ErrorApi ? e.message : 'No se ha podido guardar'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="reservas-externas">
      <Campo
        etiqueta="Boton de reservar"
        ayuda={
          original
            ? 'Ahora mismo lleva fuera. Borra la direccion para volver al formulario de la web.'
            : 'Vacio: lleva al formulario de la web. Pon una direccion para mandarlo a otro sistema.'
        }
      >
        <Entrada
          type="url"
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setGuardado(false);
          }}
          placeholder="https://www.covermanager.com/..."
        />
      </Campo>

      {original && (
        <p className="reservas-externas__aviso">
          <strong>Estas reservas no entran aqui.</strong> No salen en la bandeja, no
          llega el aviso al local y no cuentan para el historico. Hay que mirarlas en el
          otro sistema.
        </p>
      )}

      {error && <p className="reservas-externas__error">{error}</p>}
      {guardado && !cambiado && <p className="reservas-externas__ok">Guardado.</p>}

      {cambiado && (
        <Boton variante="secundario" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </Boton>
      )}
    </div>
  );
}
