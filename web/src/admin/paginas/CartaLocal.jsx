import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import Modal from '../componentes/Modal.jsx';
import { Aviso, Boton, Campo, Entrada, Seleccion } from '../componentes/Campos.jsx';

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export default function CartaLocal() {
  const { esAdmin, localFijo } = useAuth();
  const [params, setParams] = useSearchParams();

  const locales = useDatos(() => adminApi.restaurantes(), []);
  const listaLocales = locales.datos ?? [];

  // Un encargado no elige: siempre su local. El admin elige, y la eleccion
  // queda en la URL para poder compartir el enlace.
  const localId = esAdmin
    ? Number(params.get('local')) || listaLocales[0]?.id
    : localFijo;

  const carta = useDatos(
    () => (localId ? adminApi.carta(localId) : Promise.resolve(null)),
    [localId]
  );

  const [error, setError] = useState(null);
  const [anadiendo, setAnadiendo] = useState(false);
  const [historicoDe, setHistoricoDe] = useState(null);

  const local = listaLocales.find((l) => l.id === localId);

  const conError = async (accion) => {
    setError(null);
    try {
      await accion();
      carta.recargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
    }
  };

  const mover = (categoria, indice, direccion) => {
    const items = [...categoria.items];
    const destino = indice + direccion;
    if (destino < 0 || destino >= items.length) return;
    [items[indice], items[destino]] = [items[destino], items[indice]];
    conError(() => adminApi.reordenar(localId, items.map((i) => i.id)));
  };

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Carta</h1>
          <p className="apagado">
            Los precios y la disponibilidad son de este local. El nombre y la
            descripcion del plato salen del catalogo del grupo.
          </p>
        </div>

        <div className="pagina__acciones">
          {esAdmin && (
            <Seleccion
              value={localId ?? ''}
              onChange={(e) => setParams({ local: e.target.value })}
              aria-label="Local"
            >
              {listaLocales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </Seleccion>
          )}
          <Boton variante="principal" onClick={() => setAnadiendo(true)} disabled={!localId}>
            Anadir plato
          </Boton>
        </div>
      </header>

      <Aviso tipo="error">{error ?? carta.error?.message}</Aviso>

      {carta.cargando && <p className="admin-cargando">Cargando la carta...</p>}

      {carta.datos?.total === 0 && (
        <p className="admin-vacio">
          Esta carta esta vacia. Anade platos desde el catalogo del grupo.
        </p>
      )}

      {carta.datos?.categorias.map((categoria) => (
        <section key={categoria.id} className="bloque-categoria">
          <h2>
            {categoria.nombre}
            <span className="apagado"> · {categoria.items.length}</span>
          </h2>

          <table className="tabla">
            <thead>
              <tr>
                <th className="tabla__orden">Orden</th>
                <th>Plato</th>
                <th className="tabla__precio">Precio</th>
                <th className="tabla__centro">En carta</th>
                <th className="tabla__centro">Destacado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categoria.items.map((item, indice) => (
                <tr key={item.id} className={item.activo ? undefined : 'tabla__fila--apagada'}>
                  <td className="tabla__orden">
                    <button
                      type="button"
                      className="mini"
                      onClick={() => mover(categoria, indice, -1)}
                      disabled={indice === 0}
                      aria-label="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="mini"
                      onClick={() => mover(categoria, indice, 1)}
                      disabled={indice === categoria.items.length - 1}
                      aria-label="Bajar"
                    >
                      ↓
                    </button>
                  </td>

                  <td>
                    <div className="celda-plato">
                      {item.imagen_thumb ? (
                        <img src={item.imagen_thumb} alt="" className="miniatura" />
                      ) : (
                        <span className="miniatura miniatura--vacia" aria-hidden="true" />
                      )}
                      <div>
                        <strong>{item.nombre}</strong>
                        {!item.plato_activo && (
                          <span className="etiqueta-mini etiqueta-mini--alerta">
                            retirado del catalogo
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="tabla__precio">
                    <PrecioEditable
                      valor={item.precio}
                      onGuardar={(precio) => conError(() => adminApi.editarItem(item.id, { precio }))}
                    />
                  </td>

                  <td className="tabla__centro">
                    <input
                      type="checkbox"
                      checked={item.activo}
                      disabled={!item.plato_activo && !item.activo}
                      onChange={(e) =>
                        conError(() => adminApi.editarItem(item.id, { activo: e.target.checked }))
                      }
                      aria-label={`${item.nombre} en carta`}
                    />
                  </td>

                  <td className="tabla__centro">
                    <input
                      type="checkbox"
                      checked={item.destacado}
                      onChange={(e) =>
                        conError(() =>
                          adminApi.editarItem(item.id, { destacado: e.target.checked })
                        )
                      }
                      aria-label={`${item.nombre} destacado`}
                    />
                  </td>

                  <td className="tabla__derecha">
                    <button
                      type="button"
                      className="enlace"
                      onClick={() => setHistoricoDe(item)}
                    >
                      Historico
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {anadiendo && (
        <AnadirPlato
          localId={localId}
          nombreLocal={local?.nombre}
          onCerrar={() => setAnadiendo(false)}
          onHecho={() => {
            setAnadiendo(false);
            carta.recargar();
          }}
        />
      )}

      {historicoDe && (
        <HistorialPrecios item={historicoDe} onCerrar={() => setHistoricoDe(null)} />
      )}
    </>
  );
}

/** Precio editable en la propia tabla: guarda al salir del campo o con Enter. */
function PrecioEditable({ valor, onGuardar }) {
  // Se muestra con dos decimales, pero se admite escribir con coma.
  const formatear = (v) => Number(v).toFixed(2);
  const [texto, setTexto] = useState(() => formatear(valor));

  useEffect(() => setTexto(formatear(valor)), [valor]);

  const guardar = () => {
    const numero = Number(texto.replace(',', '.'));
    if (!Number.isFinite(numero) || numero < 0) {
      setTexto(formatear(valor));
      return;
    }
    if (numero === Number(valor)) {
      setTexto(formatear(valor));
      return;
    }
    onGuardar(numero);
  };

  return (
    <input
      className="entrada entrada--precio"
      inputMode="decimal"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') setTexto(formatear(valor));
      }}
      aria-label="Precio"
    />
  );
}

function AnadirPlato({ localId, nombreLocal, onCerrar, onHecho }) {
  const disponibles = useDatos(() => adminApi.cartaDisponibles(localId), [localId]);
  const [busqueda, setBusqueda] = useState('');
  const [elegido, setElegido] = useState(null);
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const lista = useMemo(() => {
    const todos = disponibles.datos ?? [];
    const texto = busqueda.trim().toLowerCase();
    return texto
      ? todos.filter((p) => p.nombre.toLowerCase().includes(texto))
      : todos;
  }, [disponibles.datos, busqueda]);

  const guardar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await adminApi.anadirACarta(localId, {
        plato_id: elegido.id,
        precio: Number(precio.replace(',', '.')),
      });
      onHecho();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo={`Anadir plato a ${nombreLocal ?? 'la carta'}`}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Boton>
          <Boton
            variante="principal"
            onClick={guardar}
            disabled={!elegido || precio === '' || enviando}
          >
            {enviando ? 'Anadiendo...' : 'Anadir a la carta'}
          </Boton>
        </>
      }
    >
      <Aviso tipo="error">{error}</Aviso>

      <Campo etiqueta="Buscar en el catalogo del grupo">
        <Entrada
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Croquetas, arroz..."
          autoFocus
        />
      </Campo>

      {disponibles.cargando && <p className="admin-cargando">Cargando catalogo...</p>}

      {!disponibles.cargando && lista.length === 0 && (
        <p className="admin-vacio">
          {busqueda
            ? 'Ningun plato coincide con la busqueda.'
            : 'Este local ya sirve todos los platos del catalogo.'}
        </p>
      )}

      <ul className="lista-elegible">
        {lista.slice(0, 60).map((plato) => (
          <li key={plato.id}>
            <button
              type="button"
              className={`elegible ${elegido?.id === plato.id ? 'elegible--activo' : ''}`}
              onClick={() => setElegido(plato)}
            >
              <span>{plato.nombre}</span>
              <span className="apagado">{plato.categoria_nombre}</span>
            </button>
          </li>
        ))}
      </ul>

      {elegido && (
        <Campo etiqueta={`Precio en este local para "${elegido.nombre}"`}>
          <Entrada
            inputMode="decimal"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="12,50"
          />
        </Campo>
      )}
    </Modal>
  );
}

function HistorialPrecios({ item, onCerrar }) {
  const historico = useDatos(() => adminApi.historico(item.id), [item.id]);
  const registros = historico.datos ?? [];

  return (
    <Modal titulo={`Historico de precios · ${item.nombre}`} onCerrar={onCerrar} ancho="560px">
      {historico.cargando && <p className="admin-cargando">Cargando...</p>}

      {!historico.cargando && registros.length === 0 && (
        <p className="admin-vacio">
          Este plato no ha cambiado de precio desde que esta en la carta.
        </p>
      )}

      {registros.length > 0 && (
        <table className="tabla tabla--compacta">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cambio</th>
              <th>Quien</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.fecha.replace(' ', 'T') + 'Z').toLocaleString('es-ES')}</td>
                <td>
                  <span className="apagado">{euros.format(r.precio_anterior)}</span>
                  {' → '}
                  <strong>{euros.format(r.precio_nuevo)}</strong>
                </td>
                <td>{r.usuario_nombre ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
