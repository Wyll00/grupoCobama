import { lazy } from 'react';
import { Route } from 'react-router-dom';

// Todo perezoso y nada importado de forma directa: este fichero no debe
// arrastrar el panel al bundle de la web publica.
const AdminShell = lazy(() => import('./AdminShell.jsx'));
const AdminProtegido = lazy(() => import('./AdminProtegido.jsx'));
const Login = lazy(() => import('./paginas/Login.jsx'));
const Panel = lazy(() => import('./paginas/Panel.jsx'));
const CartaLocal = lazy(() => import('./paginas/CartaLocal.jsx'));
const Platos = lazy(() => import('./paginas/Platos.jsx'));
const Ocupacion = lazy(() => import('./paginas/Ocupacion.jsx'));
const Usuarios = lazy(() => import('./paginas/Usuarios.jsx'));

/**
 * Arbol de rutas del panel.
 *
 * Se declara con segmentos estaticos ("/admin/carta") en lugar de un comodin
 * ("/admin/*") a proposito: react-router no resuelve por orden sino por
 * puntuacion, y "/:slug/carta" puntua MAS que "/admin/*". Con el comodin,
 * /admin/carta acababa entrando por la web publica con slug="admin".
 */
export function rutasAdmin() {
  return (
    <Route path="/admin" element={<AdminShell />}>
      <Route path="entrar" element={<Login />} />

      <Route element={<AdminProtegido />}>
        <Route index element={<Panel />} />
        <Route path="carta" element={<CartaLocal />} />
        <Route path="platos" element={<Platos />} />
        <Route path="ocupacion" element={<Ocupacion />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>
    </Route>
  );
}
