import { useState } from 'react';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import { useAuth } from '../auth.jsx';
import Modal from '../componentes/Modal.jsx';
import { Aviso, Boton, Campo, Entrada, Seleccion } from '../componentes/Campos.jsx';

/**
 * Socios: apuntar visitas y entregar premios.
 *
 * LO PRIMERO Y MAS GRANDE ES APUNTAR LA VISITA. Es lo que se hace cincuenta
 * veces en un servicio, de pie y con el comandero en la mano; todo lo demas
 * -dar de alta, buscar, mirar el historial- se hace de vez en cuando y puede
 * pedir dos pulsaciones mas.
 *
 * El codigo se teclea. Un lector de QR de verdad en el panel seria mejor, pero
 * pide permiso de camara y un aparato por sala; ocho caracteres se escriben en
 * cinco segundos y funciona en cualquier movil desde el primer dia.
 */

export default function Socios() {
  const { usuario, esAdmin } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [dandoDeAlta, setDandoDeAlta] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const lista = useDatos(() => adminApi.socios(busqueda), [busqueda]);

  // El admin de grupo no esta en ninguna sala, asi que tiene que decir en que
  // casa se apunta. Un encargado no: sale de su sesion.
  const [localElegido, setLocalElegido] = useState('');
  const locales = useDatos(() => adminApi.restaurantes(), []);

  const apuntar = async (e) => {
    e?.preventDefault();
    const limpio = codigo.trim().toUpperCase();
    if (!limpio) return;

    setTrabajando(true);
    setError(null);
    try {
      const cuerpo = {};
      if (esAdmin) {
        if (!localElegido) {
          setError('Elige en qué casa se apunta la visita');
          setTrabajando(false);
          return;
        }
        cuerpo.restaurante_id = Number(localElegido);
      }
      const tarjeta = await adminApi.apuntarVisita(limpio, cuerpo);
      setResultado(tarjeta);
      setCodigo('');
      lista.recargar();
    } catch (err) {
      setResultado(null);
      setError(err instanceof ErrorApi ? err.message : 'No se ha podido apuntar');
    } finally {
      setTrabajando(false);
    }
  };

  const entregar = async (premioId) => {
    try {
      const tarjeta = await adminApi.entregarPremio(premioId);
      setResultado(tarjeta);
      lista.recargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se ha podido entregar');
    }
  };

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Socios</h1>
          <p className="apagado">
            Apunta la visita y, a las 8, entrégale el premio. La tarjeta vale en las
            cuatro casas.
          </p>
        </div>
        <Boton variante="principal" onClick={() => setDandoDeAlta(true)}>
          Nuevo socio
        </Boton>
      </header>

      {/* La acción del día a día, arriba y grande. */}
      <form className="apuntar" onSubmit={apuntar}>
        <Campo etiqueta="Código de la tarjeta">
          <Entrada
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ej. TDUXN435"
            autoComplete="off"
            autoFocus
            maxLength={10}
          />
        </Campo>

        {esAdmin && (
          <Campo etiqueta="En qué casa">
            <Seleccion value={localElegido} onChange={(e) => setLocalElegido(e.target.value)}>
              <option value="">Elige un local</option>
              {(locales.datos ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </Seleccion>
          </Campo>
        )}

        <Boton variante="principal" type="submit" disabled={trabajando || !codigo.trim()}>
          {trabajando ? 'Apuntando...' : 'Apuntar visita'}
        </Boton>
      </form>

      <Aviso tipo="error">{error}</Aviso>

      {resultado && <Resultado tarjeta={resultado} onEntregar={entregar} />}

      <section className="seccion-panel" style={{ marginTop: '2.5rem' }}>
        <h2>Todos los socios</h2>
        <Campo etiqueta="Buscar por nombre, teléfono o código">
          <Entrada
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Escribe para filtrar..."
          />
        </Campo>

        <Aviso tipo="error">{lista.error?.message}</Aviso>

        {lista.datos?.length === 0 ? (
          <p className="admin-vacio">
            {busqueda ? 'Ningún socio coincide.' : 'Todavía no hay socios.'}
          </p>
        ) : (
          <ul className="socios">
            {(lista.datos ?? []).map((s) => (
              <li key={s.codigo} className="socio-fila">
                <div>
                  <strong>{s.nombre}</strong>
                  <span className="socio-fila__codigo">{s.codigo}</span>
                </div>
                <span className="socio-fila__visitas">
                  {s.visitas} {s.visitas === 1 ? 'visita' : 'visitas'}
                </span>
                {s.premiosPendientes > 0 ? (
                  <span className="socio-fila__premio">
                    {s.premiosPendientes} premio{s.premiosPendientes > 1 ? 's' : ''} sin entregar
                  </span>
                ) : (
                  <span className="apagado">
                    {s.faltan === 0 ? '—' : `faltan ${s.faltan}`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {dandoDeAlta && (
        <NuevoSocio
          esAdmin={esAdmin}
          locales={locales.datos ?? []}
          onCerrar={() => setDandoDeAlta(false)}
          onHecho={(tarjeta) => {
            setDandoDeAlta(false);
            setResultado(tarjeta);
            lista.recargar();
          }}
        />
      )}
    </>
  );
}

/**
 * Lo que sale después de apuntar.
 *
 * Tiene que leerse de un vistazo desde el comandero, así que lo que manda es
 * el número de visitas y, si lo hay, el premio. Cuando la visita estaba
 * repetida se dice con todas las letras: quien lo pulsó necesita saber que la
 * primera sí entró, no quedarse con la duda y volver a pulsar.
 */
function Resultado({ tarjeta, onEntregar }) {
  const pendientes = tarjeta.premios.filter((p) => !p.entregado_en);

  return (
    <div className={`resultado ${pendientes.length > 0 ? 'resultado--premio' : ''}`}>
      <div className="resultado__quien">
        <strong>{tarjeta.nombre}</strong>
        <span className="apagado">{tarjeta.codigo}</span>
      </div>

      {tarjeta.repetida && (
        <p className="resultado__repetida">
          Ya tenía una visita apuntada hoy en esta casa. <strong>No se ha duplicado.</strong>
        </p>
      )}

      <p className="resultado__cuenta">
        <strong>{tarjeta.visitas}</strong> {tarjeta.visitas === 1 ? 'visita' : 'visitas'}
        {pendientes.length === 0 && tarjeta.faltan > 0 && (
          <span className="apagado"> · faltan {tarjeta.faltan} para el premio</span>
        )}
      </p>

      {pendientes.map((p) => (
        <div key={p.id} className="resultado__premio-fila">
          <span>
            <strong>¡Premio!</strong> Conseguido con {p.visitas} visitas.
          </span>
          <Boton variante="principal" onClick={() => onEntregar(p.id)}>
            Marcar entregado
          </Boton>
        </div>
      ))}
    </div>
  );
}

function NuevoSocio({ esAdmin, locales, onCerrar, onHecho }) {
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', restaurante_id: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cuerpo = { nombre: form.nombre, telefono: form.telefono, email: form.email };
      if (esAdmin && form.restaurante_id) cuerpo.restaurante_id = Number(form.restaurante_id);
      onHecho(await adminApi.crearSocio(cuerpo));
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se ha podido dar de alta');
      setEnviando(false);
    }
  };

  return (
    <Modal titulo="Nuevo socio" onCerrar={onCerrar} ancho="440px">
      <form onSubmit={enviar}>
        <Aviso tipo="error">{error}</Aviso>

        <Campo etiqueta="Nombre">
          <Entrada value={form.nombre} onChange={cambiar('nombre')} required autoFocus />
        </Campo>
        <Campo etiqueta="Teléfono" ayuda="Opcional">
          <Entrada value={form.telefono} onChange={cambiar('telefono')} type="tel" />
        </Campo>
        <Campo etiqueta="Email" ayuda="Opcional. Sin él no se le puede avisar del premio">
          <Entrada value={form.email} onChange={cambiar('email')} type="email" />
        </Campo>

        {esAdmin && (
          <Campo etiqueta="Se hace socio en" ayuda="Opcional. Solo para saber de dónde vienen las altas">
            <Seleccion value={form.restaurante_id} onChange={cambiar('restaurante_id')}>
              <option value="">—</option>
              {locales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </Seleccion>
          </Campo>
        )}

        <Boton variante="principal" type="submit" disabled={enviando}>
          {enviando ? 'Dando de alta...' : 'Dar de alta'}
        </Boton>
      </form>
    </Modal>
  );
}
