import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { ErrorApi } from '../api.js';
import { Aviso, Boton, Campo, Entrada } from '../componentes/Campos.jsx';

export default function Login() {
  const { usuario, comprobando, entrar } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (comprobando) return <p className="admin-cargando">Comprobando sesion...</p>;
  if (usuario) return <Navigate to={ubicacion.state?.desde ?? '/admin'} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await entrar(email, password);
      navegar(ubicacion.state?.desde ?? '/admin', { replace: true });
    } catch (err) {
      setError(
        err instanceof ErrorApi ? err.message : 'No se ha podido conectar con el servidor'
      );
      setEnviando(false);
    }
  };

  return (
    <div className="entrar">
      <form className="entrar__caja" onSubmit={enviar}>
        <h1>
          Cobama <span>Panel</span>
        </h1>
        <p className="entrar__intro">Gestion de cartas y precios del grupo.</p>

        <Aviso tipo="error">{error}</Aviso>

        <Campo etiqueta="Email">
          <Entrada
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </Campo>

        <Campo etiqueta="Contrasena">
          <Entrada
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Campo>

        <button className="btn btn--principal btn--ancho" type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
