import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { adminApi, ErrorApi } from '../api.js';
import Modal from './Modal.jsx';
import AvisoOcupacion from './AvisoOcupacion.jsx';
import { Aviso, Boton, Campo, Entrada } from './Campos.jsx';

export default function AdminLayout() {
  const { usuario, salir, esAdmin } = useAuth();
  const navegar = useNavigate();
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const alSalir = async () => {
    await salir();
    navegar('/admin/entrar');
  };

  return (
    <div className="admin">
      <header className="admin__cabecera">
        <div className="admin__cabecera-interior">
          <Link to="/admin" className="admin__marca">
            Cobama <span>Panel</span>
          </Link>

          <nav className="admin__nav">
            <NavLink to="/admin" end>
              Inicio
            </NavLink>
            <NavLink to="/admin/carta">Cartas</NavLink>
            <NavLink to="/admin/platos">Catalogo</NavLink>
            <NavLink to="/admin/ocupacion">Ocupacion</NavLink>
            {esAdmin && <NavLink to="/admin/usuarios">Usuarios</NavLink>}
          </nav>

          <div className="admin__usuario">
            <div className="admin__usuario-datos">
              <strong>{usuario?.nombre}</strong>
              <span>{esAdmin ? 'Admin de grupo' : 'Encargado'}</span>
            </div>
            <Boton onClick={() => setCambiandoPassword(true)}>Contrasena</Boton>
            <Boton onClick={alSalir}>Salir</Boton>
          </div>
        </div>
      </header>

      <main className="admin__contenido">
        <Outlet />
      </main>

      {/* Fijo abajo y presente en todo el panel: en sala se esta en cualquier
          pantalla cuando toca responder. */}
      <AvisoOcupacion />

      {cambiandoPassword && (
        <CambiarPassword onCerrar={() => setCambiandoPassword(false)} onHecho={alSalir} />
      )}
    </div>
  );
}

function CambiarPassword({ onCerrar, onHecho }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (nueva !== repetida) {
      setError('Las dos contrasenas nuevas no coinciden');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await adminApi.cambiarPassword(actual, nueva);
      // El servidor revoca todas las sesiones, incluida esta.
      await onHecho();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo="Cambiar contrasena"
      onCerrar={onCerrar}
      ancho="420px"
      pie={
        <>
          <Boton onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Boton>
          <Boton variante="principal" onClick={guardar} disabled={enviando}>
            {enviando ? 'Guardando...' : 'Cambiar'}
          </Boton>
        </>
      }
    >
      <Aviso tipo="error">{error}</Aviso>
      <Aviso>Al cambiarla se cierran todas las sesiones y habra que entrar de nuevo.</Aviso>

      <Campo etiqueta="Contrasena actual">
        <Entrada type="password" value={actual} onChange={(e) => setActual(e.target.value)} />
      </Campo>
      <Campo etiqueta="Nueva contrasena" ayuda="Minimo 10 caracteres">
        <Entrada type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
      </Campo>
      <Campo etiqueta="Repite la nueva">
        <Entrada type="password" value={repetida} onChange={(e) => setRepetida(e.target.value)} />
      </Campo>
    </Modal>
  );
}
