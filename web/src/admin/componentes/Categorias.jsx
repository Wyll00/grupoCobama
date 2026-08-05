import { useState } from 'react';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import Modal from './Modal.jsx';
import { Aviso, Boton, Campo, Entrada } from './Campos.jsx';

/**
 * Gestion de las secciones de la carta.
 *
 * El orden de aqui es el orden en que salen en la carta publica, asi que las
 * flechas no son un detalle: deciden si el cliente ve antes los entrantes o
 * los postres.
 */
export default function Categorias({ onCerrar, onCambio }) {
  const categorias = useDatos(() => adminApi.categoriasAdmin(), []);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [nueva, setNueva] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const lista = categorias.datos ?? [];

  const conError = async (accion) => {
    setError(null);
    setAviso(null);
    setOcupado(true);
    try {
      const resultado = await accion();
      categorias.recargar();
      onCambio?.();
      return resultado;
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
    } finally {
      setOcupado(false);
    }
  };

  const crear = () =>
    conError(async () => {
      await adminApi.crearCategoria({ nombre: nueva.trim() });
      setNueva('');
    });

  const mover = (indice, direccion) => {
    const ids = lista.map((c) => c.id);
    const destino = indice + direccion;
    if (destino < 0 || destino >= ids.length) return;
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    conError(() => adminApi.reordenarCategorias(ids));
  };

  const borrar = (categoria) =>
    conError(async () => {
      const res = await adminApi.borrarCategoria(categoria.id);
      if (res?.accion === 'desactivada') setAviso(res.motivo);
    });

  return (
    <Modal titulo="Secciones de la carta" onCerrar={onCerrar} ancho="620px">
      <Aviso tipo="error">{error}</Aviso>
      <Aviso>{aviso}</Aviso>

      <p className="apagado nota-seccion">
        El orden de esta lista es el orden en que el cliente ve las secciones en la carta.
        Una seccion oculta no sale en la web, pero sus platos siguen ahi.
      </p>

      {categorias.cargando && <p className="admin-cargando">Cargando...</p>}

      {lista.length > 0 && (
        <table className="tabla tabla--compacta">
          <thead>
            <tr>
              <th className="tabla__orden">Orden</th>
              <th>Seccion</th>
              <th className="tabla__centro">Platos</th>
              <th className="tabla__centro">Visible</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lista.map((categoria, indice) => (
              <tr key={categoria.id} className={categoria.activo ? undefined : 'tabla__fila--apagada'}>
                <td className="tabla__orden">
                  <button
                    type="button"
                    className="mini"
                    onClick={() => mover(indice, -1)}
                    disabled={indice === 0 || ocupado}
                    aria-label="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="mini"
                    onClick={() => mover(indice, 1)}
                    disabled={indice === lista.length - 1 || ocupado}
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                </td>

                <td>
                  <NombreEditable
                    valor={categoria.nombre}
                    disabled={ocupado}
                    onGuardar={(nombre) =>
                      conError(() => adminApi.editarCategoria(categoria.id, { nombre }))
                    }
                  />
                </td>

                <td className="tabla__centro apagado">{categoria.platos}</td>

                <td className="tabla__centro">
                  <input
                    type="checkbox"
                    checked={categoria.activo}
                    disabled={ocupado}
                    onChange={(e) =>
                      conError(() =>
                        adminApi.editarCategoria(categoria.id, { activo: e.target.checked })
                      )
                    }
                    aria-label={`${categoria.nombre} visible`}
                  />
                </td>

                <td className="tabla__derecha">
                  <button
                    type="button"
                    className="enlace"
                    onClick={() => borrar(categoria)}
                    disabled={ocupado}
                    title={
                      categoria.platos > 0
                        ? 'Tiene platos, asi que se ocultara en lugar de borrarse'
                        : 'Se borrara: no tiene ningun plato'
                    }
                  >
                    {categoria.platos > 0 ? 'Ocultar' : 'Borrar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="alta-rapida">
        <Campo etiqueta="Nueva seccion">
          <Entrada
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && nueva.trim().length >= 2 && crear()}
            placeholder="Segundos, Cocteles, Sin gluten..."
          />
        </Campo>
        <Boton variante="principal" onClick={crear} disabled={nueva.trim().length < 2 || ocupado}>
          Anadir
        </Boton>
      </div>
    </Modal>
  );
}

/** Nombre editable en la propia fila: guarda al salir o con Enter. */
function NombreEditable({ valor, onGuardar, disabled }) {
  const [texto, setTexto] = useState(valor);

  const guardar = () => {
    const limpio = texto.trim();
    if (limpio.length < 2 || limpio === valor) {
      setTexto(valor);
      return;
    }
    onGuardar(limpio);
  };

  return (
    <input
      className="entrada"
      value={texto}
      disabled={disabled}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setTexto(valor);
          e.currentTarget.blur();
        }
      }}
      aria-label="Nombre de la seccion"
    />
  );
}
