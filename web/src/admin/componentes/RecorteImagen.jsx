import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Boton } from './Campos.jsx';

// Las fichas de plato se muestran en 4:3, asi que el recorte fuerza esa
// proporcion. Si se dejara libre, cada foto llegaria con una distinta y la
// carta se veria irregular.
const PROPORCION = 4 / 3;

/**
 * Selector de recorte. Devuelve el rectangulo en pixeles de la imagen
 * ORIGINAL, que es lo que espera sharp en el servidor.
 */
export default function RecorteImagen({ fichero, onConfirmar, onCancelar, enviando }) {
  const [url, setUrl] = useState(null);
  const [original, setOriginal] = useState(null);
  const [caja, setCaja] = useState(null);
  const [anchoMostrado, setAnchoMostrado] = useState(0);

  const contenedor = useRef(null);
  const arrastre = useRef(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(fichero);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [fichero]);

  // Recorte mas grande posible en 4:3, centrado.
  const cajaMaxima = useMemo(() => {
    if (!original) return null;
    const { ancho, alto } = original;
    const anchoPorAlto = alto * PROPORCION;
    return anchoPorAlto <= ancho
      ? { ancho: Math.floor(anchoPorAlto), alto }
      : { ancho, alto: Math.floor(ancho / PROPORCION) };
  }, [original]);

  const alCargar = (e) => {
    const { naturalWidth: ancho, naturalHeight: alto } = e.currentTarget;
    setOriginal({ ancho, alto });

    const anchoPorAlto = alto * PROPORCION;
    const max =
      anchoPorAlto <= ancho
        ? { ancho: Math.floor(anchoPorAlto), alto }
        : { ancho, alto: Math.floor(ancho / PROPORCION) };

    setCaja({
      x: Math.floor((ancho - max.ancho) / 2),
      y: Math.floor((alto - max.alto) / 2),
      ancho: max.ancho,
      alto: max.alto,
    });
  };

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;
    const observador = new ResizeObserver(([entrada]) =>
      setAnchoMostrado(entrada.contentRect.width)
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [url]);

  const escala = original && anchoMostrado ? anchoMostrado / original.ancho : 0;

  const limitar = useCallback(
    (x, y, ancho, alto) => ({
      x: Math.max(0, Math.min(x, original.ancho - ancho)),
      y: Math.max(0, Math.min(y, original.alto - alto)),
      ancho,
      alto,
    }),
    [original]
  );

  const alPuntero = (e) => {
    if (!caja) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { inicioX: e.clientX, inicioY: e.clientY, caja };
  };

  const alMover = (e) => {
    if (!arrastre.current || !escala) return;
    const { inicioX, inicioY, caja: partida } = arrastre.current;
    const dx = (e.clientX - inicioX) / escala;
    const dy = (e.clientY - inicioY) / escala;
    setCaja(limitar(Math.round(partida.x + dx), Math.round(partida.y + dy), partida.ancho, partida.alto));
  };

  const alSoltar = (e) => {
    arrastre.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // El zoom mantiene el centro del recorte donde estaba.
  const alCambiarZoom = (valor) => {
    const proporcion = Number(valor) / 100;
    const ancho = Math.max(80, Math.round(cajaMaxima.ancho * proporcion));
    const alto = Math.round(ancho / PROPORCION);
    const centroX = caja.x + caja.ancho / 2;
    const centroY = caja.y + caja.alto / 2;
    setCaja(limitar(Math.round(centroX - ancho / 2), Math.round(centroY - alto / 2), ancho, alto));
  };

  const zoomActual = caja && cajaMaxima ? Math.round((caja.ancho / cajaMaxima.ancho) * 100) : 100;

  return (
    <div className="recorte">
      <div className="recorte__lienzo" ref={contenedor}>
        {url && <img src={url} alt="" onLoad={alCargar} draggable={false} />}

        {caja && escala > 0 && (
          <div
            className="recorte__caja"
            style={{
              left: `${caja.x * escala}px`,
              top: `${caja.y * escala}px`,
              width: `${caja.ancho * escala}px`,
              height: `${caja.alto * escala}px`,
            }}
            onPointerDown={alPuntero}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
          >
            <span className="recorte__pista">Arrastra para encuadrar</span>
          </div>
        )}
      </div>

      {caja && (
        <>
          <label className="recorte__zoom">
            <span>Encuadre</span>
            <input
              type="range"
              min="25"
              max="100"
              value={zoomActual}
              onChange={(e) => alCambiarZoom(e.target.value)}
            />
            <span className="recorte__medidas">
              {caja.ancho} × {caja.alto} px
            </span>
          </label>

          <p className="recorte__nota">
            Se guardara en 4:3, convertida a WebP, en dos tamanos: 1200×900 para la
            ficha y 400×300 para los listados.
          </p>
        </>
      )}

      <div className="recorte__acciones">
        <Boton onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Boton>
        <Boton variante="principal" onClick={() => onConfirmar(caja)} disabled={!caja || enviando}>
          {enviando ? 'Subiendo...' : 'Guardar imagen'}
        </Boton>
      </div>
    </div>
  );
}
