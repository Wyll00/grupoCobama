import { useEffect, useState } from 'react';
import { useAuth } from '../auth.jsx';
import { adminApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import EditorPlato from '../componentes/EditorPlato.jsx';
import { puedeEditarPlato } from '../permisos.js';
import Categorias from '../componentes/Categorias.jsx';
import { Aviso, Boton, Entrada, Seleccion } from '../componentes/Campos.jsx';

export default function Platos() {
  const { esAdmin, localFijo } = useAuth();

  const [filtros, setFiltros] = useState({ q: '', categoria: '', activo: 'todos', pagina: 1 });
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null); // id, o 'nuevo'
  const [gestionandoCategorias, setGestionandoCategorias] = useState(false);

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
            <Boton onClick={() => setGestionandoCategorias(true)}>Secciones</Boton>
            <Boton variante="principal" onClick={() => setEditando('nuevo')}>
              Nuevo plato
            </Boton>
          </div>
        )}
      </header>

      {!esAdmin && (
        <Aviso>
          Aqui estan los platos de las cuatro casas. Puedes editar los que solo sirvas tu;
          los que comparten varios locales los mantiene la administracion del grupo,
          porque el nombre y la descripcion son los mismos para todos. Para dar de alta
          uno nuevo, ve a <strong>Cartas</strong> → <strong>Anadir plato</strong>.
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
                    {puedeEditarPlato(plato, { esAdmin, localFijo }) ? 'Editar' : 'Ver'}
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

      {gestionandoCategorias && (
        <Categorias
          onCerrar={() => setGestionandoCategorias(false)}
          onCambio={() => {
            categorias.recargar();
            platos.recargar();
          }}
        />
      )}

      {editando && (
        <EditorPlato
          id={editando === 'nuevo' ? null : editando}
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
