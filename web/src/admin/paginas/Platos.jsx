import { useEffect, useState } from 'react';
import { useAuth } from '../auth.jsx';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import Modal from '../componentes/Modal.jsx';
import RecorteImagen from '../componentes/RecorteImagen.jsx';
import {
  Aviso,
  AreaTexto,
  Boton,
  Campo,
  Entrada,
  Interruptor,
  Seleccion,
} from '../componentes/Campos.jsx';

export default function Platos() {
  const { esAdmin } = useAuth();

  const [filtros, setFiltros] = useState({ q: '', categoria: '', activo: 'todos', pagina: 1 });
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null); // id, o 'nuevo'

  // La busqueda no dispara una peticion por tecla.
  useEffect(() => {
    const id = setTimeout(
      () => setFiltros((f) => ({ ...f, q: busqueda, pagina: 1 })),
      300
    );
    return () => clearTimeout(id);
  }, [busqueda]);

  const categorias = useDatos(() => adminApi.categorias(), []);
  const platos = useDatos(() => adminApi.platos(filtros), [JSON.stringify(filtros)]);

  const resultado = platos.datos;

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Catalogo del grupo</h1>
          <p className="apagado">
            Un plato se da de alta una sola vez aqui. Cada local decide despues si lo
            sirve y a que precio.
          </p>
        </div>

        {esAdmin && (
          <div className="pagina__acciones">
            <Boton variante="principal" onClick={() => setEditando('nuevo')}>
              Nuevo plato
            </Boton>
          </div>
        )}
      </header>

      {!esAdmin && (
        <Aviso>
          Solo lectura: el catalogo lo mantiene la administracion del grupo. Desde{' '}
          <strong>Cartas</strong> puedes anadir cualquiera de estos platos a tu local.
        </Aviso>
      )}

      <Aviso tipo="error">{platos.error?.message}</Aviso>

      <div className="filtros-admin">
        <Entrada
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o descripcion..."
          aria-label="Buscar"
        />
        <Seleccion
          value={filtros.categoria}
          onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value, pagina: 1 }))}
          aria-label="Categoria"
        >
          <option value="">Todas las categorias</option>
          {(categorias.datos ?? []).map((c) => (
            <option key={c.id} value={c.slug}>
              {c.nombre}
            </option>
          ))}
        </Seleccion>
        <Seleccion
          value={filtros.activo}
          onChange={(e) => setFiltros((f) => ({ ...f, activo: e.target.value, pagina: 1 }))}
          aria-label="Estado"
        >
          <option value="todos">Activos y retirados</option>
          <option value="1">Solo activos</option>
          <option value="0">Solo retirados</option>
        </Seleccion>
      </div>

      {platos.cargando && <p className="admin-cargando">Cargando catalogo...</p>}

      {resultado?.datos.length === 0 && (
        <p className="admin-vacio">Ningun plato coincide con estos filtros.</p>
      )}

      {resultado?.datos.length > 0 && (
        <table className="tabla">
          <thead>
            <tr>
              <th className="tabla__miniatura" />
              <th>Plato</th>
              <th>Categoria</th>
              <th>Alergenos</th>
              <th className="tabla__centro">Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {resultado.datos.map((plato) => (
              <tr key={plato.id} className={plato.activo ? undefined : 'tabla__fila--apagada'}>
                <td className="tabla__miniatura">
                  {plato.imagen_thumb ? (
                    <img src={plato.imagen_thumb} alt="" className="miniatura" />
                  ) : (
                    <span className="miniatura miniatura--vacia" aria-hidden="true" />
                  )}
                </td>
                <td>
                  <strong>{plato.nombre}</strong>
                  {plato.descripcion && (
                    <div className="apagado tabla__secundario">{plato.descripcion}</div>
                  )}
                  {(plato.es_vegano || plato.es_vegetariano) && (
                    <span className="etiqueta-mini etiqueta-mini--verde">
                      {plato.es_vegano ? 'Vegano' : 'Vegetariano'}
                    </span>
                  )}
                </td>
                <td>{plato.categoria_nombre}</td>
                <td className="apagado">
                  {plato.alergenos.length === 0
                    ? '—'
                    : plato.alergenos.map((a) => a.nombre).join(', ')}
                </td>
                <td className="tabla__centro">
                  {plato.activo ? (
                    <span className="punto punto--si">Activo</span>
                  ) : (
                    <span className="punto punto--no">Retirado</span>
                  )}
                </td>
                <td className="tabla__derecha">
                  <button type="button" className="enlace" onClick={() => setEditando(plato.id)}>
                    {esAdmin ? 'Editar' : 'Ver'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {resultado && resultado.paginacion.paginas > 1 && (
        <nav className="paginacion">
          <Boton
            onClick={() => setFiltros((f) => ({ ...f, pagina: f.pagina - 1 }))}
            disabled={resultado.paginacion.pagina <= 1}
          >
            Anterior
          </Boton>
          <span className="apagado">
            Pagina {resultado.paginacion.pagina} de {resultado.paginacion.paginas} ·{' '}
            {resultado.paginacion.total} platos
          </span>
          <Boton
            onClick={() => setFiltros((f) => ({ ...f, pagina: f.pagina + 1 }))}
            disabled={resultado.paginacion.pagina >= resultado.paginacion.paginas}
          >
            Siguiente
          </Boton>
        </nav>
      )}

      {editando && (
        <EditorPlato
          id={editando === 'nuevo' ? null : editando}
          soloLectura={!esAdmin}
          categorias={categorias.datos?.datos ?? []}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            platos.recargar();
          }}
        />
      )}
    </>
  );
}

const VACIO = {
  categoria_id: '',
  nombre: '',
  nombre_en: '',
  descripcion: '',
  descripcion_en: '',
  es_vegetariano: false,
  es_vegano: false,
  activo: true,
  alergenos: [],
};

function EditorPlato({ id, soloLectura, categorias, onCerrar, onGuardado }) {
  const esNuevo = id === null;
  const alergenos = useDatos(() => adminApi.alergenos(), []);
  const existente = useDatos(
    () => (esNuevo ? Promise.resolve(null) : adminApi.plato(id)),
    [id]
  );

  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [ficheroImagen, setFicheroImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const plato = existente.datos;

  useEffect(() => {
    if (!plato) return;
    setForm({
      categoria_id: plato.categoria_id,
      nombre: plato.nombre,
      nombre_en: plato.nombre_en ?? '',
      descripcion: plato.descripcion ?? '',
      descripcion_en: plato.descripcion_en ?? '',
      es_vegetariano: plato.es_vegetariano,
      es_vegano: plato.es_vegano,
      activo: plato.activo,
      alergenos: plato.alergenos.map((a) => a.id),
    });
  }, [plato]);

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const alternarAlergeno = (idAlergeno) =>
    setForm((f) => ({
      ...f,
      alergenos: f.alergenos.includes(idAlergeno)
        ? f.alergenos.filter((a) => a !== idAlergeno)
        : [...f.alergenos, idAlergeno],
    }));

  const guardar = async () => {
    setEnviando(true);
    setError(null);
    try {
      // Vegano implica vegetariano: se manda coherente para que no queden
      // platos marcados como veganos pero no vegetarianos.
      const datos = { ...form, es_vegetariano: form.es_vegetariano || form.es_vegano };
      if (esNuevo) await adminApi.crearPlato(datos);
      else await adminApi.editarPlato(id, datos);
      onGuardado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  const retirar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await adminApi.desactivarPlato(id);
      onGuardado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  const subirRecorte = async (recorte) => {
    setSubiendo(true);
    setError(null);
    try {
      const datos = new FormData();
      datos.append('imagen', ficheroImagen);
      if (recorte) {
        datos.append('x', recorte.x);
        datos.append('y', recorte.y);
        datos.append('ancho', recorte.ancho);
        datos.append('alto', recorte.alto);
      }
      await adminApi.subirImagen(id, datos);
      setFicheroImagen(null);
      existente.recargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
    } finally {
      setSubiendo(false);
    }
  };

  if (ficheroImagen) {
    return (
      <Modal titulo="Encuadrar la imagen" onCerrar={() => setFicheroImagen(null)} ancho="720px">
        <Aviso tipo="error">{error}</Aviso>
        <RecorteImagen
          fichero={ficheroImagen}
          enviando={subiendo}
          onCancelar={() => setFicheroImagen(null)}
          onConfirmar={subirRecorte}
        />
      </Modal>
    );
  }

  return (
    <Modal
      titulo={esNuevo ? 'Nuevo plato' : plato?.nombre ?? 'Cargando...'}
      onCerrar={onCerrar}
      ancho="760px"
      pie={
        soloLectura ? (
          <Boton onClick={onCerrar}>Cerrar</Boton>
        ) : (
          <>
            {!esNuevo && form.activo && (
              <Boton onClick={retirar} disabled={enviando}>
                Retirar del catalogo
              </Boton>
            )}
            <Boton onClick={onCerrar} disabled={enviando}>
              Cancelar
            </Boton>
            <Boton variante="principal" onClick={guardar} disabled={enviando}>
              {enviando ? 'Guardando...' : 'Guardar'}
            </Boton>
          </>
        )
      }
    >
      <Aviso tipo="error">{error}</Aviso>
      {existente.cargando && <p className="admin-cargando">Cargando...</p>}

      <fieldset disabled={soloLectura} className="formulario">
        <div className="formulario__fila">
          <Campo etiqueta="Nombre">
            <Entrada value={form.nombre} onChange={cambiar('nombre')} />
          </Campo>
          <Campo etiqueta="Nombre en ingles" ayuda="Se puede rellenar mas adelante">
            <Entrada value={form.nombre_en} onChange={cambiar('nombre_en')} />
          </Campo>
        </div>

        <Campo etiqueta="Categoria">
          <Seleccion value={form.categoria_id} onChange={cambiar('categoria_id')}>
            <option value="">Elige una categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Seleccion>
        </Campo>

        <Campo etiqueta="Descripcion">
          <AreaTexto value={form.descripcion} onChange={cambiar('descripcion')} />
        </Campo>

        <Campo etiqueta="Descripcion en ingles">
          <AreaTexto value={form.descripcion_en} onChange={cambiar('descripcion_en')} />
        </Campo>

        <div className="formulario__interruptores">
          <Interruptor
            etiqueta="Vegetariano"
            checked={form.es_vegetariano || form.es_vegano}
            disabled={form.es_vegano}
            onChange={cambiar('es_vegetariano')}
          />
          <Interruptor etiqueta="Vegano" checked={form.es_vegano} onChange={cambiar('es_vegano')} />
          <Interruptor etiqueta="Activo en el catalogo" checked={form.activo} onChange={cambiar('activo')} />
        </div>

        <Campo
          etiqueta="Alergenos"
          ayuda="Informacion obligatoria por el Reglamento (UE) 1169/2011. Confirmala con cocina."
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
      </fieldset>

      {!esNuevo && (
        <>
          <h3 className="subtitulo">Imagen</h3>
          <div className="imagen-plato">
            {plato?.imagen ? (
              <img src={plato.imagen} alt={plato.nombre} />
            ) : (
              <div className="imagen-plato__vacia">Sin imagen</div>
            )}

            {!soloLectura && (
              <div className="imagen-plato__acciones">
                <label className="btn btn--secundario">
                  {plato?.imagen ? 'Cambiar imagen' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFicheroImagen(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {plato?.imagen && (
                  <Boton
                    onClick={async () => {
                      await adminApi.quitarImagen(id);
                      existente.recargar();
                    }}
                  >
                    Quitar
                  </Boton>
                )}
              </div>
            )}
          </div>

          <h3 className="subtitulo">En que cartas esta</h3>
          {plato?.en_cartas?.length ? (
            <ul className="lista-cartas">
              {plato.en_cartas.map((c) => (
                <li key={c.id}>
                  <span>{c.restaurante_nombre}</span>
                  <span>
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(c.precio)}
                    {!c.activo && <span className="apagado"> · fuera de carta</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="apagado">Todavia no lo sirve ningun local.</p>
          )}
        </>
      )}
    </Modal>
  );
}
