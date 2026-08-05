import { adminApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import Modal from './Modal.jsx';

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/**
 * Historico de precios de una linea de carta.
 *
 * `titulo` lo pone quien lo abre: desde la carta de un local interesa el
 * nombre del plato, y desde la ficha del plato interesa el del local.
 */
export default function HistorialPrecios({ cartaItemId, titulo, onCerrar }) {
  const historico = useDatos(() => adminApi.historico(cartaItemId), [cartaItemId]);
  const registros = historico.datos ?? [];

  // La fecha llega de MySQL como '2026-08-05 17:35:26', sin zona y en UTC.
  // Sin la Z, new Date() la interpretaria como hora local.
  const enLocal = (fecha) => new Date(fecha.replace(' ', 'T') + 'Z').toLocaleString('es-ES');

  return (
    <Modal titulo={`Historico de precios · ${titulo}`} onCerrar={onCerrar} ancho="560px">
      {historico.cargando && <p className="admin-cargando">Cargando...</p>}

      {!historico.cargando && registros.length === 0 && (
        <p className="admin-vacio">
          Este plato no ha cambiado de precio desde que esta en la carta.
        </p>
      )}

      {registros.length > 0 && (
        <table className="tabla tabla--compacta">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cambio</th>
              <th>Quien</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id}>
                <td>{enLocal(r.fecha)}</td>
                <td>
                  <span className="apagado">{euros.format(r.precio_anterior)}</span>
                  {' → '}
                  <strong>{euros.format(r.precio_nuevo)}</strong>
                </td>
                <td>{r.usuario_nombre ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
