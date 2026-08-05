import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ProveedorAuth } from './auth.jsx';
import '../styles/admin.css';

/**
 * Raiz del panel: proveedor de sesion, estilos y frontera de carga perezosa.
 *
 * Todo el panel cuelga de aqui y se carga en un chunk aparte. La web publica
 * no debe descargar ni un byte de esto: el cliente llega escaneando un QR
 * desde la mesa, a menudo con datos moviles y mala cobertura.
 */
export default function AdminShell() {
  return (
    <ProveedorAuth>
      <Suspense fallback={<p className="admin-cargando">Cargando el panel...</p>}>
        <Outlet />
      </Suspense>
    </ProveedorAuth>
  );
}
