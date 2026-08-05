import { useState } from 'react';
import { adminApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import Modal from './Modal.jsx';
import { Aviso, Boton } from './Campos.jsx';

/**
 * Enlace y QR de la carta publica de un local.
 *
 * El enlace es fijo y no caduca: apunta a la carta, que se lee de la base de
 * datos en cada visita. Cambiar un precio en el panel se ve al instante en el
 * enlace que ya esta publicado, sin volver a compartir nada.
 */
export default function Compartir({ restauranteId, nombreLocal, onCerrar }) {
  const qr = useDatos(() => adminApi.qr(restauranteId), [restauranteId]);
  const [copiado, setCopiado] = useState(null);

  const datos = qr.datos;

  const copiar = async (texto, cual) => {
    await navigator.clipboard.writeText(texto);
    setCopiado(cual);
    setTimeout(() => setCopiado(null), 2000);
  };

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
    const respuesta = await fetch(datos.png);
    descargar(await respuesta.blob(), `qr-${datos.restaurante.slug}.png`);
  };

  const mensaje = datos
    ? `Esta es la carta de ${datos.restaurante.nombre}: ${datos.url}`
    : '';

  // La hoja de compartir del sistema solo existe en movil y con HTTPS. En
  // escritorio no aparece el boton en lugar de dar un error al pulsarlo.
  const puedeCompartirNativo = typeof navigator.share === 'function';

  return (
    <Modal titulo={`Compartir la carta · ${nombreLocal}`} onCerrar={onCerrar} ancho="520px">
      {qr.cargando && <p className="admin-cargando">Preparando...</p>}
      <Aviso tipo="error">{qr.error?.message}</Aviso>

      {datos && (
        <>
          {!datos.listoParaImprimir && (
            <Aviso tipo="error">
              <strong>Este enlace todavia no sirve fuera de aqui.</strong> Apunta a{' '}
              <code>localhost</code>, que solo funciona en este ordenador. Cuando la web
              este publicada hay que cambiar <code>WEB_BASE_URL</code> en la configuracion
              de la API y este enlace pasara a ser el definitivo.
            </Aviso>
          )}

          <h3 className="subtitulo">Enlace</h3>
          <p className="apagado nota-seccion">
            Siempre el mismo. Los cambios que hagas en la carta se ven al momento, sin
            tener que volver a compartirlo.
          </p>

          <div className="compartir__enlace">
            <input className="entrada" value={datos.url} readOnly onFocus={(e) => e.target.select()} />
            <Boton variante="principal" onClick={() => copiar(datos.url, 'enlace')}>
              {copiado === 'enlace' ? 'Copiado' : 'Copiar'}
            </Boton>
          </div>

          <div className="compartir__acciones">
            <a className="btn btn--secundario" href={datos.url} target="_blank" rel="noreferrer">
              Abrir la carta
            </a>
            <Boton onClick={() => copiar(mensaje, 'mensaje')}>
              {copiado === 'mensaje' ? 'Copiado' : 'Copiar con texto'}
            </Boton>
            <a
              className="btn btn--secundario"
              href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            {puedeCompartirNativo && (
              <Boton
                onClick={() =>
                  navigator
                    .share({ title: `Carta de ${datos.restaurante.nombre}`, url: datos.url })
                    .catch(() => {})
                }
              >
                Compartir
              </Boton>
            )}
          </div>

          <h3 className="subtitulo">Codigo QR</h3>
          <p className="apagado nota-seccion">
            El mismo enlace, para el adhesivo de la mesa o el cartel de la entrada.
          </p>

          <div className="qr">
            {/* El SVG se pinta en linea para que se vea nitido a cualquier tamano. */}
            <div className="qr__imagen" dangerouslySetInnerHTML={{ __html: datos.svg }} />
          </div>

          <div className="qr__acciones">
            <Boton onClick={descargarPng}>Descargar PNG</Boton>
            <Boton
              onClick={() =>
                descargar(datos.svg, `qr-${datos.restaurante.slug}.svg`, 'image/svg+xml')
              }
            >
              Descargar SVG
            </Boton>
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
