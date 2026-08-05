import { useEffect, useState } from 'react';
import { useAuth } from '../auth.jsx';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import Modal from '../componentes/Modal.jsx';
import {
  Aviso,
  Boton,
  Campo,
  Entrada,
  Interruptor,
  Seleccion,
} from '../componentes/Campos.jsx';

export default function Usuarios() {
  const { usuario: yo, esAdmin } = useAuth();
  const usuarios = useDatos(() => (esAdmin ? adminApi.usuarios() : Promise.resolve([])), [esAdmin]);
  const locales = useDatos(() => adminApi.restaurantes(), []);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState(null);

  const lista = usuarios.datos ?? [];

  // El servidor ya devuelve 403 a un encargado; esto es solo para que no vea
  // una pantalla rota mientras tanto.
  if (!esAdmin) {
    return (
      <Aviso tipo="error">Esta seccion es solo para administradores del grupo.</Aviso>
    );
  }

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Usuarios</h1>
          <p className="apagado">
            Un encargado solo ve y edita la carta de su local. Un admin de grupo llega a
            los cuatro y al catalogo maestro.
          </p>
        </div>
        <div className="pagina__acciones">
          <Boton variante="principal" onClick={() => setEditando('nuevo')}>
            Nuevo usuario
          </Boton>
        </div>
      </header>

      <Aviso tipo="error">{error ?? usuarios.error?.message}</Aviso>

      {usuarios.cargando && <p className="admin-cargando">Cargando usuarios...</p>}

      {lista.length > 0 && (
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Local</th>
              <th>Ultimo acceso</th>
              <th className="tabla__centro">Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id} className={u.activo ? undefined : 'tabla__fila--apagada'}>
                <td>
                  <strong>{u.nombre}</strong>
                  {u.id === yo.id && <span className="etiqueta-mini">tu</span>}
                </td>
                <td className="apagado">{u.email}</td>
                <td>{u.rol === 'admin_grupo' ? 'Admin de grupo' : 'Encargado'}</td>
                <td>{u.restaurante_nombre ?? '—'}</td>
                <td className="apagado">
                  {u.ultimo_acceso
                    ? new Date(u.ultimo_acceso.replace(' ', 'T') + 'Z').toLocaleString('es-ES')
                    : 'nunca'}
                </td>
                <td className="tabla__centro">
                  <span className={`punto ${u.activo ? 'punto--si' : 'punto--no'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="tabla__derecha">
                  <button type="button" className="enlace" onClick={() => setEditando(u.id)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editando && (
        <EditorUsuario
          id={editando === 'nuevo' ? null : editando}
          usuarios={lista}
          locales={locales.datos ?? []}
          yo={yo}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            setError(null);
            usuarios.recargar();
          }}
          onError={setError}
        />
      )}
    </>
  );
}

function EditorUsuario({ id, usuarios, locales, yo, onCerrar, onGuardado }) {
  const esNuevo = id === null;
  const actual = usuarios.find((u) => u.id === id);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'encargado_local',
    restaurante_id: '',
    activo: true,
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!actual) return;
    setForm({
      nombre: actual.nombre,
      email: actual.email,
      password: '',
      rol: actual.rol,
      restaurante_id: actual.restaurante_id ?? '',
      activo: actual.activo,
    });
  }, [actual]);

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const guardar = async () => {
    setEnviando(true);
    setError(null);

    const datos = {
      nombre: form.nombre,
      email: form.email,
      rol: form.rol,
      // Un admin de grupo no se asigna a ningun local; el servidor lo valida
      // igualmente, pero mandarlo coherente evita un 400 evitable.
      restaurante_id: form.rol === 'admin_grupo' ? null : Number(form.restaurante_id) || null,
      activo: form.activo,
    };
    if (form.password) datos.password = form.password;

    try {
      if (esNuevo) await adminApi.crearUsuario(datos);
      else await adminApi.editarUsuario(id, datos);
      onGuardado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  const esYo = id === yo.id;

  return (
    <Modal
      titulo={esNuevo ? 'Nuevo usuario' : `Editar ${actual?.nombre ?? ''}`}
      onCerrar={onCerrar}
      ancho="520px"
      pie={
        <>
          <Boton onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Boton>
          <Boton variante="principal" onClick={guardar} disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar'}
          </Boton>
        </>
      }
    >
      <Aviso tipo="error">{error}</Aviso>
      {esYo && <Aviso>Es tu propio usuario: no puedes cambiarte el rol ni desactivarte.</Aviso>}

      <Campo etiqueta="Nombre">
        <Entrada value={form.nombre} onChange={cambiar('nombre')} />
      </Campo>

      <Campo etiqueta="Email">
        <Entrada type="email" value={form.email} onChange={cambiar('email')} autoComplete="off" />
      </Campo>

      <Campo
        etiqueta={esNuevo ? 'Contrasena' : 'Nueva contrasena'}
        ayuda={
          esNuevo
            ? 'Minimo 10 caracteres'
            : 'Dejalo vacio para no cambiarla. Al cambiarla se cierran sus sesiones abiertas.'
        }
      >
        <Entrada
          type="password"
          value={form.password}
          onChange={cambiar('password')}
          autoComplete="new-password"
        />
      </Campo>

      <Campo etiqueta="Rol">
        <Seleccion value={form.rol} onChange={cambiar('rol')} disabled={esYo}>
          <option value="encargado_local">Encargado de local</option>
          <option value="admin_grupo">Admin de grupo</option>
        </Seleccion>
      </Campo>

      {form.rol === 'encargado_local' && (
        <Campo etiqueta="Local">
          <Seleccion value={form.restaurante_id} onChange={cambiar('restaurante_id')}>
            <option value="">Elige un local</option>
            {locales.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </Seleccion>
        </Campo>
      )}

      <div className="formulario__interruptores">
        <Interruptor
          etiqueta="Usuario activo"
          checked={form.activo}
          onChange={cambiar('activo')}
          disabled={esYo}
        />
      </div>
    </Modal>
  );
}
