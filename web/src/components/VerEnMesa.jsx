import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

/**
 * Ver el plato encima de la mesa, a tamano real.
 *
 * Como funciona la realidad aumentada en web, que no es obvio:
 *   - Android abre Scene Viewer, que come .glb
 *   - iOS abre AR Quick Look, que come .usdz
 * No hay un formato que valga para los dos, y model-viewer se encarga de
 * despachar a uno u otro. Sin fichero .usdz, en iPhone se ve el modelo 3D
 * girable pero no el boton de camara.
 *
 * La libreria pesa unos 300 KB, asi que se carga solo cuando alguien abre
 * esto: la carta la abre gente en la mesa con datos moviles y no puede pagar
 * ese peso por adelantado.
 */
export default function VerEnMesa({ plato, onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vigente = true;

    Promise.all([
      import('@google/model-viewer'),
      api.ar(plato.id),
    ])
      .then(([, respuesta]) => {
        if (!vigente) return;
        if (!respuesta.disponible) {
          setError('Este plato todavia no se puede ver en la mesa.');
          return;
        }
        setDatos(respuesta);
      })
      .catch(() => vigente && setError('No se ha podido cargar la vista.'))
      .finally(() => vigente && setListo(true));

    return () => {
      vigente = false;
    };
  }, [plato.id]);

  useEffect(() => {
    const alPulsar = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', alPulsar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflow;
    };
  }, [onCerrar]);

  return (
    <div
      className="mesa__fondo"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
      role="dialog"
      aria-modal="true"
      aria-label={`Ver ${plato.nombre} en la mesa`}
    >
      <div className="mesa">
        <header className="mesa__cabecera">
          <div>
            <h2>{plato.nombre}</h2>
            {datos?.ancho_cm && (
              <p className="mesa__medida">Mide unos {datos.ancho_cm} cm de ancho</p>
            )}
          </div>
          <button type="button" className="mesa__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="mesa__cuerpo">
          {!listo && <p className="mesa__aviso">Preparando la vista...</p>}
          {error && <p className="mesa__aviso">{error}</p>}

          {/*
            loading y reveal en eager: por defecto model-viewer espera a que el
            elemento entre en pantalla mediante IntersectionObserver. Aqui ya
            ha entrado, porque el usuario acaba de pulsar para abrir esto, y
            esperar otro ciclo solo anade retardo.

            camera-orbit: la orbita por defecto son 75 grados desde la
            vertical, o sea casi horizontal. Un plato tumbado visto de canto no
            se ve, asi que se mira desde arriba en angulo, como se mira un
            plato sentado a la mesa. El tope de 80 grados evita que al girar
            con el dedo se acabe otra vez de canto y parezca que desaparece.
          */}
          {datos && (
            <model-viewer
              src={datos.glb}
              ios-src={datos.usdz ?? undefined}
              alt={`${plato.nombre} a tamano real`}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-placement="floor"
              camera-controls
              touch-action="pan-y"
              loading="eager"
              reveal="eager"
              camera-orbit="0deg 35deg auto"
              max-camera-orbit="Infinity 80deg auto"
              shadow-intensity="1"
              exposure="1"
              class="mesa__visor"
            >
              <button slot="ar-button" className="mesa__boton-ar">
                Ponerlo en mi mesa
              </button>
            </model-viewer>
          )}
        </div>

        <footer className="mesa__pie">
          {datos?.modo === 'foto' && (
            <p>
              Es la foto del plato a tamano real, para hacerse una idea de la racion. Apunta
              con el movil a la mesa y pulsa <strong>Ponerlo en mi mesa</strong>.
            </p>
          )}
          {datos?.modo === 'modelo' && (
            <p>
              Modelo del plato a tamano real. Apunta con el movil a la mesa y pulsa{' '}
              <strong>Ponerlo en mi mesa</strong>.
            </p>
          )}
          <p className="mesa__nota">
            La camara solo se abre desde el movil. En el ordenador se ve el modelo, pero no
            se puede poner en la mesa.
          </p>
        </footer>
      </div>
    </div>
  );
}
