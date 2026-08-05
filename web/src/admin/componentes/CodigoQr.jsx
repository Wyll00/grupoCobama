import { useState } from 'react';
import { adminApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import Modal from './Modal.jsx';
import { Aviso, Boton } from './Campos.jsx';

/**
 * QR de la carta publica de un local, para el adhesivo de la mesa o el cartel
 * de la entrada.
 *
 * El SVG es el que hay que mandar a imprenta: escala a cualquier tamano sin
 * pixelarse. El PNG vale para WhatsApp, redes o pegarlo en un documento.
 */
export default function CodigoQr({ restauranteId, nombreLocal, onCerrar }) {
  const qr = useDatos(() => adminApi.qr(restauranteId), [restauranteId]);
  const [copiado, setCopiado] = useState(false);

  const datos = qr.datos;

  const descargar = (contenido, nombre, tipo) => {
    const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const descargarPng = async () => {
    // El PNG viene como data URI; se pasa a blob para poder nombrar el fichero.
    const respuesta = await fetch(datos.png);
    descargar(await respuesta.blob(), `qr-${datos.restaurante.slug}.png`);
  };

  const copiarEnlace = async () => {
    await navigator.clipboard.writeText(datos.url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Modal titulo={`QR de la carta · ${nombreLocal}`} onCerrar={onCerrar} ancho="480px">
      {qr.cargando && <p className="admin-cargando">Generando...</p>}
      <Aviso tipo="error">{qr.error?.message}</Aviso>

      {datos && (
        <>
          {!datos.listoParaImprimir && (
            <Aviso tipo="error">
              <strong>Todavia no se puede imprimir.</strong> Este QR apunta a{' '}
              <code>localhost</code>, que solo funciona en este ordenador. Cuando la web
              este publicada hay que cambiar <code>WEB_BASE_URL</code> en la
              configuracion de la API y volver a generarlo.
            </Aviso>
          )}

          <div className="qr">
            {/* El SVG se pinta en linea para que se vea nitido a cualquier tamano. */}
            <div className="qr__imagen" dangerouslySetInnerHTML={{ __html: datos.svg }} />

            <p className="qr__url">
              <span className="apagado">Apunta a</span>
              <br />
              <a href={datos.url} target="_blank" rel="noreferrer">
                {datos.url}
              </a>
            </p>
          </div>

          <div className="qr__acciones">
            <Boton variante="principal" onClick={descargarPng}>
              Descargar PNG
            </Boton>
            <Boton
              onClick={() =>
                descargar(datos.svg, `qr-${datos.restaurante.slug}.svg`, 'image/svg+xml')
              }
            >
              Descargar SVG
            </Boton>
            <Boton onClick={copiarEnlace}>{copiado ? 'Copiado' : 'Copiar enlace'}</Boton>
          </div>

          <p className="qr__nota apagado">
            Para imprimir usa el SVG: escala desde un adhesivo de mesa hasta un cartel sin
            perder calidad. El PNG va bien para redes o WhatsApp.
          </p>
        </>
      )}
    </Modal>
  );
}
