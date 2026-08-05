import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import Modal from '../componentes/Modal.jsx';
import PrecioEditable from '../componentes/PrecioEditable.jsx';
import HistorialPrecios from '../componentes/HistorialPrecios.jsx';
import CodigoQr from '../componentes/CodigoQr.jsx';
import EditorPlato from '../componentes/EditorPlato.jsx';
import { Aviso, Boton, Campo, Entrada, Interruptor, Seleccion } from '../componentes/Campos.jsx';

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
  const [mostrandoQr, setMostrandoQr] = useState(false);
  const [editandoPlato, setEditandoPlato] = useState(null);

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
          <Boton onClick={() => setMostrandoQr(true)} disabled={!localId}>
            QR de la carta
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
                        {/* El nombre abre la ficha del plato: corregir una
                            errata sin salir de la carta es lo normal. */}
                        <button
                          type="button"
                          className="enlace-plato"
                          onClick={() => setEditandoPlato(item.plato_id)}
                          title={esAdmin ? 'Editar la ficha del plato' : 'Ver la ficha del plato'}
                        >
                          {item.nombre}
                        </button>
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
        <HistorialPrecios
          cartaItemId={historicoDe.id}
          titulo={historicoDe.nombre}
          onCerrar={() => setHistoricoDe(null)}
        />
      )}

      {mostrandoQr && (
        <CodigoQr
          restauranteId={localId}
          nombreLocal={local?.nombre}
          onCerrar={() => setMostrandoQr(false)}
        />
      )}

      {editandoPlato && (
        <EditorPlato
          id={editandoPlato}
          soloLectura={!esAdmin}
          onCerrar={() => setEditandoPlato(null)}
          onGuardado={() => {
            setEditandoPlato(null);
            // El nombre o la descripcion pueden haber cambiado.
            carta.recargar();
          }}
        />
      )}
    </>
  );
}

/**
 * Alta de un plato en la carta, por dos caminos.
 *
 * "Del catalogo" es el habitual: el plato ya existe en el grupo y solo hay que
 * decidir el precio de esta casa. "Crear nuevo" es para cuando el plato no
 * existe todavia: lo da de alta en el catalogo y lo mete en esta carta de una
 * vez, que es como se piensa en cocina cuando entra un plato nuevo.
 *
 * Crear toca el catalogo del grupo, asi que ese camino solo lo ve el admin.
 */
function AnadirPlato({ localId, nombreLocal, onCerrar, onHecho }) {
  const { esAdmin } = useAuth();
  const [modo, setModo] = useState('catalogo');

  return (
    <Modal titulo={`Anadir plato a ${nombreLocal ?? 'la carta'}`} onCerrar={onCerrar} ancho="680px">
      {esAdmin && (
        <div className="pestanas-modal">
          <button
            type="button"
            className={`pestana ${modo === 'catalogo' ? 'pestana--activa' : ''}`}
            onClick={() => setModo('catalogo')}
          >
            Del catalogo del grupo
          </button>
          <button
            type="button"
            className={`pestana ${modo === 'nuevo' ? 'pestana--activa' : ''}`}
            onClick={() => setModo('nuevo')}
          >
            Crear un plato nuevo
          </button>
        </div>
      )}

      {modo === 'catalogo' ? (
        <DesdeCatalogo localId={localId} onCerrar={onCerrar} onHecho={onHecho} />
      ) : (
        <PlatoNuevo localId={localId} onCerrar={onCerrar} onHecho={onHecho} />
      )}
    </Modal>
  );
}

function DesdeCatalogo({ localId, onCerrar, onHecho }) {
  const disponibles = useDatos(() => adminApi.cartaDisponibles(localId), [localId]);
  const [busqueda, setBusqueda] = useState('');
  const [elegido, setElegido] = useState(null);
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const lista = useMemo(() => {
    const todos = disponibles.datos ?? [];
    const texto = busqueda.trim().toLowerCase();
    return texto ? todos.filter((p) => p.nombre.toLowerCase().includes(texto)) : todos;
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
    <>
      <Aviso tipo="error">{error}</Aviso>

      <Campo etiqueta="Buscar en el catalogo del grupo">
        <Entrada
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Croquetas, arroz, Fanta..."
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
        {lista.slice(0, 80).map((plato) => (
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
        <Campo etiqueta={`Precio en este local para ${elegido.nombre}`}>
          <Entrada
            inputMode="decimal"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="12,50"
          />
        </Campo>
      )}

      <div className="acciones-modal">
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
      </div>
    </>
  );
}

const PLATO_VACIO = {
  nombre: '',
  categoria_id: '',
  descripcion: '',
  precio: '',
  es_vegetariano: false,
  es_vegano: false,
  destacado: false,
  alergenos: [],
};

function PlatoNuevo({ localId, onCerrar, onHecho }) {
  const categorias = useDatos(() => adminApi.categorias(), []);
  const alergenos = useDatos(() => adminApi.alergenos(), []);
  const [form, setForm] = useState(PLATO_VACIO);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const alternarAlergeno = (id) =>
    setForm((f) => ({
      ...f,
      alergenos: f.alergenos.includes(id)
        ? f.alergenos.filter((a) => a !== id)
        : [...f.alergenos, id],
    }));

  const guardar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await adminApi.crearPlatoEnCarta(localId, {
        ...form,
        // Vegano implica vegetariano: se manda coherente.
        es_vegetariano: form.es_vegetariano || form.es_vegano,
        precio: Number(String(form.precio).replace(',', '.')),
      });
      onHecho();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  const completo = form.nombre.trim().length >= 2 && form.categoria_id && form.precio !== '';

  return (
    <>
      <Aviso tipo="error">{error}</Aviso>
      <Aviso>
        El plato se da de alta en el catalogo del grupo y entra en esta carta. Las otras
        casas podran anadirlo cuando quieran, cada una a su precio.
      </Aviso>

      <div className="formulario__fila">
        <Campo etiqueta="Nombre del plato">
          <Entrada
            value={form.nombre}
            onChange={cambiar('nombre')}
            placeholder="Croquetas de bacalao"
            autoFocus
          />
        </Campo>
        <Campo etiqueta="Categoria">
          <Seleccion value={form.categoria_id} onChange={cambiar('categoria_id')}>
            <option value="">Elige una categoria</option>
            {(categorias.datos ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Seleccion>
        </Campo>
      </div>

      <Campo etiqueta="Descripcion" ayuda="Lo que lee el cliente debajo del nombre">
        <Entrada
          value={form.descripcion}
          onChange={cambiar('descripcion')}
          placeholder="Ocho unidades, con alioli de la casa."
        />
      </Campo>

      <div className="formulario__fila">
        <Campo etiqueta="Precio en este local">
          <Entrada
            inputMode="decimal"
            value={form.precio}
            onChange={cambiar('precio')}
            placeholder="9,50"
          />
        </Campo>
        <Campo etiqueta="Marcas">
          <div className="formulario__interruptores">
            <Interruptor
              etiqueta="Vegetariano"
              checked={form.es_vegetariano || form.es_vegano}
              disabled={form.es_vegano}
              onChange={cambiar('es_vegetariano')}
            />
            <Interruptor
              etiqueta="Vegano"
              checked={form.es_vegano}
              onChange={cambiar('es_vegano')}
            />
            <Interruptor
              etiqueta="De la casa"
              checked={form.destacado}
              onChange={cambiar('destacado')}
            />
          </div>
        </Campo>
      </div>

      <Campo
        etiqueta="Alergenos"
        ayuda="Obligatorio por el Reglamento (UE) 1169/2011. Confirmalo con cocina."
      >
        <div className="rejilla-alergenos">
          {(alergenos.datos ?? []).map((a) => (
            <Interruptor
              key={a.id}
              etiqueta={a.nombre}
              checked={form.alergenos.includes(a.id)}
              onChange={() => alternarAlergeno(a.id)}
            />
          ))}
        </div>
      </Campo>

      <p className="apagado nota-seccion">
        La foto se sube despues desde <strong>Catalogo</strong>, abriendo el plato.
      </p>

      <div className="acciones-modal">
        <Boton onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Boton>
        <Boton variante="principal" onClick={guardar} disabled={!completo || enviando}>
          {enviando ? 'Creando...' : 'Crear y anadir a la carta'}
        </Boton>
      </div>
    </>
  );
}
