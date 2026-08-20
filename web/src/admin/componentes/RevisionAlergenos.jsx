import { useState } from 'react';
import { adminApi, ErrorApi } from '../api.js';
import { Boton } from './Campos.jsx';

/**
 * Estado de confirmacion de los alergenos de un plato.
 *
 * Los alergenos que hay cargados de La Basilica salen de transcribir a mano
 * las fotos de la carta impresa. Sirven para trabajar, pero publicarlos como
 * si fueran definitivos no vale: de la informacion de alergenos responde el
 * establecimiento, y una transcripcion no es una ficha de receta.
 *
 * El problema es que un plato bien y un plato mal se ven exactamente igual.
 * Por eso hace falta que la pantalla diga en voz alta cual esta sin mirar:
 * si no, la duda desaparece y lo transcrito acaba pasando por confirmado sin
 * que nadie haya decidido nada.
 *
 * Confirmar es un boton aparte y no un efecto de guardar el formulario,
 * porque el formulario se guarda por mil motivos que no tienen que ver con
 * los alergenos.
 */
export default function RevisionAlergenos({ plato, soloLectura, onConfirmado }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  if (!plato) return null;

  const confirmado = Boolean(plato.alergenos_revisados_en);

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await adminApi.confirmarAlergenos(plato.id);
      onConfirmado?.();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se ha podido confirmar');
    } finally {
      setEnviando(false);
    }
  };

  const fecha = confirmado
    ? new Date(plato.alergenos_revisados_en).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className={`revision ${confirmado ? 'revision--ok' : 'revision--pendiente'}`}>
      <div className="revision__texto">
        {confirmado ? (
          <>
            <strong>Alergenos confirmados</strong> el {fecha}
            {plato.alergenos_revisados_por && ` por ${plato.alergenos_revisados_por}`}.
          </>
        ) : (
          <>
            <strong>Alergenos sin confirmar.</strong> Estan transcritos de la carta
            impresa y nadie de cocina los ha comprobado todavia.
          </>
        )}
      </div>

      {!confirmado && !soloLectura && (
        <Boton variante="secundario" onClick={confirmar} disabled={enviando}>
          {enviando ? 'Confirmando...' : 'Los he comprobado'}
        </Boton>
      )}

      {error && <p className="revision__error">{error}</p>}
    </div>
  );
}
