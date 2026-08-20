import { useState } from 'react';
import { adminApi, ErrorApi } from '../api.js';
import Modal from './Modal.jsx';
import RecorteImagen from './RecorteImagen.jsx';
import { Aviso, Boton } from './Campos.jsx';

// La cabecera de la ficha es panoramica: 1920x1000.
const PROPORCION = 1920 / 1000;

/**
 * Foto de portada de un local: la que va de fondo en la cabecera de su ficha,
 * detras del nombre.
 *
 * Tiene que ser una foto con derechos de la casa. Una imagen bajada de
 * internet en una web comercial es un problema legal, no un atajo.
 */
export default function PortadaLocal({ local, onCambio }) {
  const [fichero, setFichero] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const subir = async (recorte) => {
    setEnviando(true);
    setError(null);
    try {
      const datos = new FormData();
      datos.append('imagen', fichero);
      if (recorte) {
        datos.append('x', recorte.x);
        datos.append('y', recorte.y);
        datos.append('ancho', recorte.ancho);
        datos.append('alto', recorte.alto);
      }
      await adminApi.subirPortada(local.id, datos);
      setFichero(null);
      onCambio?.();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
    } finally {
      setEnviando(false);
    }
  };

  const quitar = async () => {
    setError(null);
    try {
      await adminApi.quitarPortada(local.id);
      onCambio?.();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'Error inesperado');
    }
  };

  return (
    <>
      <Aviso tipo="error">{error}</Aviso>

      <div className="portada">
        <label className="btn btn--secundario">
          {local.imagen_portada ? 'Cambiar portada' : 'Poner foto de portada'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFichero(f);
              e.target.value = '';
            }}
          />
        </label>
        {local.imagen_portada && <Boton onClick={quitar}>Quitar</Boton>}
      </div>

      {fichero && (
        <Modal titulo={`Portada de ${local.nombre}`} onCerrar={() => setFichero(null)} ancho="760px">
          <Aviso>
            Se ve de fondo en la cabecera de la ficha, con el nombre encima y una capa
            oscura, asi que funciona mejor una foto del espacio que un plato de cerca.
            Tiene que ser una foto vuestra: una bajada de internet os expone a una
            reclamacion de derechos.
          </Aviso>
          <RecorteImagen
            fichero={fichero}
            proporcion={PROPORCION}
            enviando={enviando}
            nota="Se guardara panoramica en 1920x1000, convertida a WebP."
            onCancelar={() => setFichero(null)}
            onConfirmar={subir}
          />
        </Modal>
      )}
    </>
  );
}
