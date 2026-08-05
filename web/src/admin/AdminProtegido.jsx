import { RutaProtegida } from './auth.jsx';
import AdminLayout from './componentes/AdminLayout.jsx';

/** Guardia de sesion mas la estructura comun de las paginas del panel. */
export default function AdminProtegido() {
  return (
    <RutaProtegida>
      <AdminLayout />
    </RutaProtegida>
  );
}
