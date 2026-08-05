import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import PrecioEditable from './PrecioEditable.jsx';
import HistorialPrecios from './HistorialPrecios.jsx';
import { Aviso, Boton, Entrada } from './Campos.jsx';

/**
 * Precio y disponibilidad de UN plato en los cuatro locales.
 *
 * Es la vista traspuesta de la pantalla de Cartas: alli se ven todos los
 * platos de un local, y aqui todos los locales de un plato. Sin esto, cambiar
 * el precio de un plato en los cuatro sitios obligaba a entrar cuatro veces
 * en Cartas.
 *
 * Un encargado solo ve editable la fila de su local; el resto las ve, porque
 * saber lo que cobra la casa de al lado es justo el motivo de tener un
 * catalogo compartido.
 */
export default function PreciosPorLocal({ platoId, platoActivo, enCartas, onCambio }) {
  const { esAdmin, localFijo } = useAuth();
  const locales = useDatos(() => adminApi.restaurantes(), []);

  const [error, setError] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [historicoDe, setHistoricoDe] = useState(null);
  const [nuevosPrecios, setNuevosPrecios] = useState({});

  const puedeEditar = (localId) => esAdmin || localId === localFijo;

  const conError = async (accion) => {
    setError(null);
    setOcupado(true);
    try {
      await accion();
      await onCambio();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
    } finally {
      setOcupado(false);
    }
  };

  const anadir = (localId) => {
    const texto = nuevosPrecios[localId] ?? '';
    const precio = Number(texto.replace(',', '.'));
    if (!Number.isFinite(precio) || precio < 0 || texto === '') {
      setError('Escribe un precio valido para anadirlo a esa carta');
      return;
    }
    conError(async () => {
      await adminApi.anadirACarta(localId, { plato_id: platoId, precio });
      setNuevosPrecios((p) => ({ ...p, [localId]: '' }));
    });
  };

  const listaLocales = (locales.datos ?? []).filter((l) => esAdmin || l.id === localFijo);
  const porLocal = new Map(enCartas.map((c) => [c.restaurante_id, c]));

  return (
    <>
      <Aviso tipo="error">{error}</Aviso>

      {!platoActivo && (
        <Aviso>
          Este plato esta retirado del catalogo, asi que no se puede anadir ni reactivar
          en ninguna carta. Reactivalo arriba para volver a servirlo.
        </Aviso>
      )}

      {locales.cargando && <p className="admin-cargando">Cargando locales...</p>}

      {listaLocales.length > 0 && (
        <table className="tabla tabla--compacta">
          <thead>
            <tr>
              <th>Local</th>
              <th className="tabla__precio">Precio</th>
              <th className="tabla__centro">En carta</th>
              <th className="tabla__centro">Destacado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {listaLocales.map((local) => {
              const item = porLocal.get(local.id);
              const editable = puedeEditar(local.id) && !ocupado;

              if (!item) {
                return (
                  <tr key={local.id} className="tabla__fila--apagada">
                    <td>{local.nombre}</td>
                    <td className="tabla__precio">
                      <Entrada
                        className="entrada entrada--precio"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={nuevosPrecios[local.id] ?? ''}
                        disabled={!editable || !platoActivo}
                        onChange={(e) =>
                          setNuevosPrecios((p) => ({ ...p, [local.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && anadir(local.id)}
                        aria-label={`Precio en ${local.nombre}`}
                      />
                    </td>
                    <td className="tabla__centro apagado" colSpan={2}>
                      no lo sirve
                    </td>
                    <td className="tabla__derecha">
                      <Boton
                        onClick={() => anadir(local.id)}
                        disabled={!editable || !platoActivo}
                      >
                        Anadir
                      </Boton>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={local.id} className={item.activo ? undefined : 'tabla__fila--apagada'}>
                  <td>{local.nombre}</td>

                  <td className="tabla__precio">
                    <PrecioEditable
                      valor={item.precio}
                      disabled={!editable}
                      etiqueta={`Precio en ${local.nombre}`}
                      onGuardar={(precio) =>
                        conError(() => adminApi.editarItem(item.id, { precio }))
                      }
                    />
                  </td>

                  <td className="tabla__centro">
                    <input
                      type="checkbox"
                      checked={item.activo}
                      // Si el plato esta retirado del catalogo, la linea se puede
                      // apagar pero no volver a encender: lo rechaza la API.
                      disabled={!editable || (!platoActivo && !item.activo)}
                      onChange={(e) =>
                        conError(() =>
                          adminApi.editarItem(item.id, { activo: e.target.checked })
                        )
                      }
                      aria-label={`En carta de ${local.nombre}`}
                    />
                  </td>

                  <td className="tabla__centro">
                    <input
                      type="checkbox"
                      checked={item.destacado}
                      disabled={!editable}
                      onChange={(e) =>
                        conError(() =>
                          adminApi.editarItem(item.id, { destacado: e.target.checked })
                        )
                      }
                      aria-label={`Destacado en ${local.nombre}`}
                    />
                  </td>

                  <td className="tabla__derecha">
                    <button
                      type="button"
                      className="enlace"
                      onClick={() => setHistoricoDe({ id: item.id, local: local.nombre })}
                    >
                      Historico
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {historicoDe && (
        <HistorialPrecios
          cartaItemId={historicoDe.id}
          titulo={historicoDe.local}
          onCerrar={() => setHistoricoDe(null)}
        />
      )}
    </>
  );
}
