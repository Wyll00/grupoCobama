import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import EstadoCoverManager from '../componentes/EstadoCoverManager.jsx';
import Modal from '../componentes/Modal.jsx';
import { Aviso, Boton, Campo, Entrada, Seleccion } from '../componentes/Campos.jsx';

const hoy = () => new Date().toLocaleDateString('en-CA');

const sumarDias = (fecha, n) => {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const enLargo = (fecha) =>
  new Date(`${fecha}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const ESTADOS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  no_presentado: 'No se presento',
};

export default function Reservas() {
  const { esAdmin, localFijo } = useAuth();
  const [params, setParams] = useSearchParams();

  const locales = useDatos(() => adminApi.restaurantes(), []);
  const listaLocales = locales.datos ?? [];

  const localId = esAdmin ? Number(params.get('local')) || listaLocales[0]?.id : localFijo;
  const fecha = params.get('fecha') ?? hoy();
  const estado = params.get('estado') ?? 'todas';

  const [error, setError] = useState(null);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(null);

  const reservas = useDatos(
    () =>
      localId
        ? adminApi.reservas(localId, { desde: fecha, hasta: fecha, estado })
        : Promise.resolve([]),
    [localId, fecha, estado]
  );

  const resumen = useDatos(
    () => (localId ? adminApi.resumenReservas(localId, fecha) : Promise.resolve(null)),
    [localId, fecha]
  );

  const lista = reservas.datos ?? [];

  const actualizar = (clave, valor) => {
    const siguientes = new URLSearchParams(params);
    if (valor === null) siguientes.delete(clave);
    else siguientes.set(clave, valor);
    setParams(siguientes, { replace: true });
  };

  const cambiarEstado = async (reserva, nuevo) => {
    setError(null);
    try {
      await adminApi.editarReserva(reserva.id, { estado: nuevo });
      reservas.recargar();
      resumen.recargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
    }
  };

  const r = resumen.datos;

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Reservas</h1>
          <p className="apagado">
            Lo que llega por la web entra como <strong>pendiente</strong> hasta que alguien
            lo confirma. Lo que se apunta aqui a mano ya cuenta como confirmado.
          </p>
        </div>

        <div className="pagina__acciones">
          {esAdmin && (
            <Seleccion
              value={localId ?? ''}
              onChange={(e) => actualizar('local', e.target.value)}
              aria-label="Local"
            >
              {listaLocales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </Seleccion>
          )}
          <Boton variante="principal" onClick={() => setCreando(true)} disabled={!localId}>
            Apuntar reserva
          </Boton>
        </div>
      </header>

      <Aviso tipo="error">{error ?? reservas.error?.message}</Aviso>

      <div className="dia">
        <Boton onClick={() => actualizar('fecha', sumarDias(fecha, -1))}>← Dia anterior</Boton>
        <div className="dia__centro">
          <strong>{enLargo(fecha)}</strong>
          <input
            className="entrada"
            type="date"
            value={fecha}
            onChange={(e) => actualizar('fecha', e.target.value)}
            aria-label="Dia"
          />
          {fecha !== hoy() && (
            <button type="button" className="enlace" onClick={() => actualizar('fecha', hoy())}>
              Ir a hoy
            </button>
          )}
        </div>
        <Boton onClick={() => actualizar('fecha', sumarDias(fecha, 1))}>Dia siguiente →</Boton>
      </div>

      {r && (
        <div className="marcadores">
          <div className="marcador marcador--pendiente">
            <strong>{r.reservas.pendiente}</strong>
            <span>pendientes</span>
          </div>
          <div className="marcador marcador--confirmada">
            <strong>{r.reservas.confirmada}</strong>
            <span>confirmadas</span>
          </div>
          <div className="marcador">
            <strong>{r.comensales_esperados}</strong>
            <span>comensales esperados</span>
          </div>
          {r.reservas.cancelada > 0 && (
            <div className="marcador marcador--apagado">
              <strong>{r.reservas.cancelada}</strong>
              <span>canceladas</span>
            </div>
          )}
        </div>
      )}

      <div className="filtros">
        {['todas', 'pendiente', 'confirmada', 'cancelada', 'no_presentado'].map((e) => (
          <button
            key={e}
            type="button"
            className={`filtro ${estado === e ? 'filtro--activo' : ''}`}
            onClick={() => actualizar('estado', e)}
          >
            {e === 'todas' ? 'Todas' : ESTADOS[e]}
          </button>
        ))}
      </div>

      {reservas.cargando && <p className="admin-cargando">Cargando...</p>}

      {!reservas.cargando && lista.length === 0 && (
        <p className="admin-vacio">No hay reservas para este dia.</p>
      )}

      {lista.length > 0 && (
        <table className="tabla">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Reserva</th>
              <th className="tabla__centro">Pax</th>
              <th>Notas</th>
              <th className="tabla__centro">Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lista.map((reserva) => (
              <tr
                key={reserva.id}
                className={
                  ['cancelada', 'no_presentado'].includes(reserva.estado)
                    ? 'tabla__fila--apagada'
                    : undefined
                }
              >
                <td className="hora-reserva">{reserva.hora.slice(0, 5)}</td>

                <td>
                  <strong>{reserva.nombre}</strong>
                  <div className="apagado tabla__secundario">
                    <a href={`tel:${reserva.telefono}`}>{reserva.telefono}</a>
                    {' · '}
                    <span className="codigo">{reserva.codigo}</span>
                    {reserva.origen !== 'web' && (
                      <span className="etiqueta-mini">{reserva.origen}</span>
                    )}
                  </div>
                </td>

                <td className="tabla__centro">{reserva.comensales}</td>

                <td className="apagado tabla__secundario">
                  {reserva.observaciones && <div>{reserva.observaciones}</div>}
                  {reserva.notas_internas && (
                    <div className="nota-interna">{reserva.notas_internas}</div>
                  )}
                  {!reserva.observaciones && !reserva.notas_internas && '—'}
                </td>

                <td className="tabla__centro">
                  <span className={`punto punto--${reserva.estado}`}>
                    {ESTADOS[reserva.estado]}
                  </span>
                  <EstadoCoverManager reserva={reserva} onCambio={() => reservas.recargar()} />
                </td>

                <td className="tabla__derecha acciones-reserva">
                  {reserva.estado === 'pendiente' && (
                    <Boton variante="principal" onClick={() => cambiarEstado(reserva, 'confirmada')}>
                      Confirmar
                    </Boton>
                  )}
                  {reserva.estado === 'confirmada' && (
                    <Boton onClick={() => cambiarEstado(reserva, 'no_presentado')}>
                      No vino
                    </Boton>
                  )}
                  {reserva.estado !== 'cancelada' && (
                    <Boton onClick={() => cambiarEstado(reserva, 'cancelada')}>Cancelar</Boton>
                  )}
                  <button type="button" className="enlace" onClick={() => setEditando(reserva)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(creando || editando) && (
        <EditorReserva
          localId={localId}
          reserva={editando}
          fechaPorDefecto={fecha}
          onCerrar={() => {
            setCreando(false);
            setEditando(null);
          }}
          onHecho={() => {
            setCreando(false);
            setEditando(null);
            reservas.recargar();
            resumen.recargar();
          }}
        />
      )}
    </>
  );
}

function EditorReserva({ localId, reserva, fechaPorDefecto, onCerrar, onHecho }) {
  const esNueva = !reserva;

  const [form, setForm] = useState(() => ({
    nombre: reserva?.nombre ?? '',
    telefono: reserva?.telefono ?? '',
    email: reserva?.email ?? '',
    fecha: reserva?.fecha ?? fechaPorDefecto,
    hora: (reserva?.hora ?? '20:30').slice(0, 5),
    comensales: reserva?.comensales ?? 2,
    observaciones: reserva?.observaciones ?? '',
    notas_internas: reserva?.notas_internas ?? '',
    origen: reserva?.origen ?? 'telefono',
  }));
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const guardar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const datos = { ...form, comensales: Number(form.comensales) };
      if (esNueva) await adminApi.crearReserva(localId, datos);
      else await adminApi.editarReserva(reserva.id, datos);
      onHecho();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo={esNueva ? 'Apuntar una reserva' : `Reserva ${reserva.codigo}`}
      onCerrar={onCerrar}
      ancho="560px"
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
      {esNueva && (
        <Aviso>
          Lo que se apunta aqui entra ya confirmado: se supone que estas hablando con el
          cliente.
        </Aviso>
      )}

      <div className="formulario__fila">
        <Campo etiqueta="Nombre">
          <Entrada value={form.nombre} onChange={cambiar('nombre')} autoFocus />
        </Campo>
        <Campo etiqueta="Telefono">
          <Entrada type="tel" value={form.telefono} onChange={cambiar('telefono')} />
        </Campo>
      </div>

      <div className="formulario__fila">
        <Campo etiqueta="Dia">
          <Entrada type="date" value={form.fecha} onChange={cambiar('fecha')} />
        </Campo>
        <Campo etiqueta="Hora">
          <Entrada type="time" value={form.hora} onChange={cambiar('hora')} />
        </Campo>
      </div>

      <div className="formulario__fila">
        <Campo etiqueta="Comensales">
          <Entrada
            type="number"
            min="1"
            max="50"
            value={form.comensales}
            onChange={cambiar('comensales')}
          />
        </Campo>
        {esNueva && (
          <Campo etiqueta="Por donde entro">
            <Seleccion value={form.origen} onChange={cambiar('origen')}>
              <option value="telefono">Telefono</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="web">Web</option>
            </Seleccion>
          </Campo>
        )}
      </div>

      <Campo etiqueta="Email" ayuda="Si lo hay, se le avisa al confirmar o cancelar">
        <Entrada type="email" value={form.email} onChange={cambiar('email')} />
      </Campo>

      <Campo etiqueta="Lo que ha pedido el cliente">
        <Entrada
          value={form.observaciones}
          onChange={cambiar('observaciones')}
          placeholder="Alergias, trona, celebracion..."
        />
      </Campo>

      <Campo etiqueta="Nota interna" ayuda="Esto no lo ve el cliente">
        <Entrada
          value={form.notas_internas}
          onChange={cambiar('notas_internas')}
          placeholder="Prefieren terraza, el ano pasado no aparecieron..."
        />
      </Campo>
    </Modal>
  );
}
