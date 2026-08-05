import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { adminApi, fijarAcceso, registrarRefresco } from './api.js';

const ContextoAuth = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [comprobando, setComprobando] = useState(true);

  /**
   * Devuelve el nuevo access token, o null si ya no hay sesion. Lo llama el
   * cliente HTTP cuando una peticion responde 401, y tambien el efecto de
   * arranque.
   *
   * Se comparte la promesa en curso: sin esto, el doble montaje de StrictMode
   * lanza dos refrescos a la vez y la rotacion del servidor los ve como una
   * reutilizacion del token.
   */
  const enCurso = useRef(null);

  const refrescar = useCallback(async () => {
    if (enCurso.current) return enCurso.current;

    enCurso.current = (async () => {
      try {
        const res = await adminApi.refrescar();
        fijarAcceso(res.datos.acceso);
        setUsuario(res.datos.usuario);
        return res.datos.acceso;
      } catch {
        fijarAcceso(null);
        setUsuario(null);
        return null;
      } finally {
        enCurso.current = null;
      }
    })();

    return enCurso.current;
  }, []);

  useEffect(() => {
    registrarRefresco(refrescar);
  }, [refrescar]);

  // Al cargar la pagina el token en memoria se ha perdido, pero la cookie de
  // refresco sigue en el navegador: se intenta recuperar la sesion.
  useEffect(() => {
    refrescar().finally(() => setComprobando(false));
  }, [refrescar]);

  const entrar = useCallback(async (email, password) => {
    const res = await adminApi.login(email, password);
    fijarAcceso(res.datos.acceso);
    setUsuario(res.datos.usuario);
    return res.datos.usuario;
  }, []);

  const salir = useCallback(async () => {
    await adminApi.salir().catch(() => {});
    fijarAcceso(null);
    setUsuario(null);
  }, []);

  const valor = {
    usuario,
    comprobando,
    entrar,
    salir,
    esAdmin: usuario?.rol === 'admin_grupo',
    // Un encargado solo gestiona su local; el admin los cuatro.
    localFijo: usuario?.rol === 'encargado_local' ? usuario.restaurante_id : null,
  };

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

export function useAuth() {
  const contexto = useContext(ContextoAuth);
  if (!contexto) throw new Error('useAuth necesita estar dentro de ProveedorAuth');
  return contexto;
}

export function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario, comprobando, esAdmin } = useAuth();
  const ubicacion = useLocation();

  if (comprobando) return <p className="admin-cargando">Comprobando sesion...</p>;

  if (!usuario) {
    return <Navigate to="/admin/entrar" replace state={{ desde: ubicacion.pathname }} />;
  }

  if (soloAdmin && !esAdmin) {
    return (
      <div className="admin-aviso admin-aviso--error">
        Esta seccion es solo para administradores del grupo.
      </div>
    );
  }

  return children;
}
