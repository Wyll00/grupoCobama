import { useMemo, useState } from 'react';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import { useAuth } from '../auth.jsx';
import Modal from '../componentes/Modal.jsx';
import { Aviso, Boton, Campo, Entrada, Seleccion } from '../componentes/Campos.jsx';

/**
 * Socios: apuntar visitas, buscarlos y mirar por donde van.
 *
 * LO PRIMERO Y MAS GRANDE ES APUNTAR LA VISITA. Es lo que se hace cincuenta
 * veces en un servicio, de pie y con el comandero en la mano; todo lo demas
 * -dar de alta, buscar, mirar el historial- se hace de vez en cuando y puede
 * pedir dos pulsaciones mas.
 *
 * El codigo se teclea. Un lector de QR de verdad en el panel seria mejor, pero
 * pide permiso de camara y un aparato por sala; ocho caracteres se escriben en
 * cinco segundos y funciona en cualquier movil desde el primer dia.
 *
 * Debajo va el listado, y ahi lo que importa no es verlos todos: es dar con
 * uno. De ahi la busqueda y los grupos por estado. Pulsando una fila se abre
 * su ficha, con el historial entero y el boton de apuntarle la visita a el,
 * que es mas seguro que teclear el codigo de memoria.
 */

const DIA = 24 * 60 * 60 * 1000;

/** Dias desde la ultima visita, o null si no ha venido nunca. */
function diasSinVenir(socio) {
  const ultima = socio.historial?.[0]?.fecha;
  if (!ultima) return null;
  return Math.floor((Date.now() - new Date(`${ultima}T12:00:00Z`).getTime()) / DIA);
}

/*
  Los grupos del listado.

  No son etiquetas que alguien ponga a mano: se deducen de los datos que ya
  trae cada socio. Y el orden no es casual, es el de la urgencia con la que
  hay que hacer algo:

    con premio   alguien tiene algo ganado y no lo ha recibido
    a punto      esta a una o dos visitas: es cuando decirselo sirve de algo
    sin estrenar se hizo socio y no ha vuelto; si hay muchos, el programa no
                 lo esta usando nadie
    dormidos     venian y han dejado de venir

  "Todos" va el primero porque es lo que se quiere el 90% de las veces.
*/
const GRUPOS = [
  { id: 'todos', rotulo: 'Todos', cumple: () => true },
  {
    id: 'premio',
    rotulo: 'Con premio sin entregar',
    cumple: (s) => s.premiosPendientes > 0,
  },
  {
    id: 'apunto',
    rotulo: 'A punto del premio',
    cumple: (s) => s.premiosPendientes === 0 && s.visitas > 0 && s.faltan > 0 && s.faltan <= 2,
  },
  {
    id: 'sinestrenar',
    rotulo: 'Sin estrenar',
    cumple: (s) => s.visitas === 0,
  },
  {
    id: 'dormidos',
    rotulo: 'Sin venir hace meses',
    cumple: (s) => {
      const d = diasSinVenir(s);
      return d !== null && d >= 90;
    },
  },
];

const enCorto = (fecha) =>
  new Date(`${fecha}T12:00:00Z`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export default function Socios() {
  const { esAdmin } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [dandoDeAlta, setDandoDeAlta] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [grupo, setGrupo] = useState('todos');
  const [fichado, setFichado] = useState(null);

  const lista = useDatos(() => adminApi.socios(busqueda), [busqueda]);

  // El admin de grupo no esta en ninguna sala, asi que tiene que decir en que
  // casa se apunta. Un encargado no: sale de su sesion.
  const [localElegido, setLocalElegido] = useState('');
  const locales = useDatos(() => adminApi.restaurantes(), []);

  const todos = lista.datos ?? [];

  // Las cuentas de cada pestana se calculan sobre la MISMA lista que se
  // filtra, no por separado: si dijeran numeros distintos de los que luego se
  // ven, no habria forma de saber cual de los dos miente.
  const cuentas = useMemo(
    () => Object.fromEntries(GRUPOS.map((g) => [g.id, todos.filter(g.cumple).length])),
    [todos]
  );

  const visibles = useMemo(
    () => todos.filter(GRUPOS.find((g) => g.id === grupo)?.cumple ?? (() => true)),
    [todos, grupo]
  );

  /**
   * Apunta una visita. El codigo viene del formulario de arriba o de la ficha.
   *
   * Es la misma funcion para los dos sitios a proposito: la regla de que un
   * encargado apunta en SU casa y el admin tiene que elegirla vive aqui una
   * vez, no una por cada boton.
   */
  const apuntar = async (cual) => {
    const limpio = String(cual ?? '').trim().toUpperCase();
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
      // Si la visita se apunto desde una ficha abierta, la ficha se queda
      // abierta y se refresca: quien la apunto esta mirando ESE historial y
      // quiere ver la linea nueva, no volver al listado.
      if (fichado) setFichado(tarjeta);
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
      if (fichado) setFichado(tarjeta);
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
      <form
        className="apuntar"
        onSubmit={(e) => {
          e.preventDefault();
          apuntar(codigo);
        }}
      >
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

        {/* Las pestañas de estado. Las que no tienen a nadie se enseñan
            igualmente, en gris y sin número: "ninguno con premio pendiente"
            es una respuesta, y esconderlas haría que la fila bailara cada vez
            que alguien llega a ocho visitas. */}
        <div className="grupos-socios" role="tablist" aria-label="Filtrar socios por estado">
          {GRUPOS.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={grupo === g.id}
              className={`grupo-socios ${grupo === g.id ? 'grupo-socios--puesto' : ''} ${
                cuentas[g.id] === 0 ? 'grupo-socios--vacio' : ''
              }`}
              onClick={() => setGrupo(g.id)}
            >
              {g.rotulo}
              {cuentas[g.id] > 0 && <span className="grupo-socios__cuenta">{cuentas[g.id]}</span>}
            </button>
          ))}
        </div>

        <Aviso tipo="error">{lista.error?.message}</Aviso>

        {visibles.length === 0 ? (
          <p className="admin-vacio">
            {busqueda
              ? 'Ningún socio coincide con la búsqueda.'
              : grupo === 'todos'
                ? 'Todavía no hay socios.'
                : 'Ningún socio en este grupo.'}
          </p>
        ) : (
          <ul className="socios">
            {visibles.map((s) => (
              <li key={s.codigo}>
                <button
                  type="button"
                  className="socio-fila socio-fila--abrible"
                  onClick={() => setFichado(s)}
                >
                  <div>
                    <strong>{s.nombre}</strong>
                    <span className="socio-fila__codigo">{s.codigo}</span>
                  </div>
                  <span className="socio-fila__visitas">
                    {s.visitas} {s.visitas === 1 ? 'visita' : 'visitas'}
                  </span>
                  <Estado socio={s} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {fichado && (
        <Ficha
          socio={fichado}
          trabajando={trabajando}
          error={error}
          esAdmin={esAdmin}
          locales={locales.datos ?? []}
          localElegido={localElegido}
          onElegirLocal={setLocalElegido}
          onCerrar={() => {
            setFichado(null);
            setError(null);
          }}
          onApuntar={() => apuntar(fichado.codigo)}
          onEntregar={entregar}
        />
      )}

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
 * La coletilla de la derecha de cada fila.
 *
 * Una sola cosa por socio, la mas urgente: con el premio pendiente no importa
 * cuanto hace que no viene, y a quien no ha venido nunca no se le dice que le
 * faltan ocho, se le dice que no ha estrenado la tarjeta.
 */
function Estado({ socio }) {
  if (socio.premiosPendientes > 0) {
    return (
      <span className="socio-fila__premio">
        {socio.premiosPendientes} premio{socio.premiosPendientes > 1 ? 's' : ''} sin entregar
      </span>
    );
  }

  if (socio.visitas === 0) return <span className="apagado">sin estrenar</span>;

  const dias = diasSinVenir(socio);
  if (dias !== null && dias >= 90) {
    return <span className="apagado">hace {Math.floor(dias / 30)} meses</span>;
  }

  return <span className="apagado">{socio.faltan === 0 ? '—' : `faltan ${socio.faltan}`}</span>;
}

/**
 * La ficha de un socio: todo lo suyo y el boton de apuntarle la visita.
 *
 * Apuntar desde aqui es mas seguro que desde el formulario de arriba, porque
 * el codigo no se teclea: ya se sabe a quien se le esta apuntando y se le
 * tiene el nombre delante. El de arriba sigue estando porque en el pase es mas
 * rapido teclear ocho caracteres que buscar a alguien en una lista.
 *
 * LA FICHA SE BASTA SOLA, y eso incluye elegir la casa y ver los errores.
 * Al principio reusaba el selector y el aviso del formulario de arriba, y el
 * resultado era un boton que no hacia nada: un admin de grupo no esta en
 * ninguna sala, asi que sin casa elegida la peticion no sale, pero el aviso
 * que lo explicaba se pintaba DETRAS del modal. Se pulsaba, no pasaba nada y
 * no habia forma de saber por que. Un encargado no ve este selector porque su
 * casa sale de su sesion.
 */
function Ficha({
  socio,
  trabajando,
  error,
  esAdmin,
  locales,
  localElegido,
  onElegirLocal,
  onCerrar,
  onApuntar,
  onEntregar,
}) {
  const pendientes = socio.premios.filter((p) => !p.entregado_en);
  const entregados = socio.premios.filter((p) => p.entregado_en);

  // En que casa viene mas. Solo si gana de verdad: con un empate, el primero
  // de la lista no es su favorita, es el orden en que llegaron las filas.
  const porCasa = socio.historial.reduce((cuenta, v) => {
    cuenta[v.local] = (cuenta[v.local] ?? 0) + 1;
    return cuenta;
  }, {});
  const ordenadas = Object.entries(porCasa).sort((a, b) => b[1] - a[1]);
  const favorita =
    ordenadas.length === 1 || (ordenadas[1] && ordenadas[0][1] > ordenadas[1][1])
      ? ordenadas[0]
      : null;

  const dias = diasSinVenir(socio);

  return (
    <Modal titulo={socio.nombre} onCerrar={onCerrar} ancho="560px">
      <div className="ficha-socio">
        <p className="ficha-socio__codigo">{socio.codigo}</p>

        <dl className="ficha-socio__cifras">
          <div>
            <dt>Visitas</dt>
            <dd>{socio.visitas}</dd>
          </div>
          <div>
            <dt>Premios</dt>
            <dd>{socio.premiosGanados}</dd>
          </div>
          <div>
            <dt>{socio.premiosPendientes > 0 ? 'Por entregar' : 'Para el siguiente'}</dt>
            <dd>{socio.premiosPendientes > 0 ? socio.premiosPendientes : socio.faltan}</dd>
          </div>
        </dl>

        <p className="apagado ficha-socio__desde">
          Socio desde {enCorto(String(socio.socioDesde).slice(0, 10))}
          {socio.altaEn && ` · alta en ${socio.altaEn.nombre}`}
          {favorita && favorita[1] > 1 && ` · viene más a ${favorita[0]}`}
          {dias !== null && dias >= 90 && ` · sin venir desde hace ${Math.floor(dias / 30)} meses`}
        </p>

        <Aviso tipo="error">{error}</Aviso>

        {esAdmin && (
          <Campo etiqueta="En qué casa se apunta">
            <Seleccion value={localElegido} onChange={(e) => onElegirLocal(e.target.value)}>
              <option value="">Elige un local</option>
              {locales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </Seleccion>
          </Campo>
        )}

        <Boton
          variante="principal"
          onClick={onApuntar}
          disabled={trabajando || (esAdmin && !localElegido)}
        >
          {trabajando ? 'Apuntando...' : 'Apuntar una visita'}
        </Boton>

        {pendientes.length > 0 && (
          <div className="ficha-socio__premios">
            {pendientes.map((p) => (
              <div key={p.id} className="resultado__premio-fila">
                <span>
                  <strong>Premio sin entregar</strong> · conseguido con {p.visitas} visitas
                </span>
                <Boton variante="principal" onClick={() => onEntregar(p.id)}>
                  Marcar entregado
                </Boton>
              </div>
            ))}
          </div>
        )}

        {entregados.length > 0 && (
          <>
            <h3 className="ficha-socio__titulo">Premios entregados</h3>
            <ul className="ficha-socio__lista">
              {entregados.map((p) => (
                <li key={p.id}>
                  <span>Con {p.visitas} visitas</span>
                  <span className="apagado">
                    {new Date(p.entregado_en).toLocaleDateString('es-ES')}
                    {p.entregado_nota ? ` · ${p.entregado_nota}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <h3 className="ficha-socio__titulo">
          Historial{socio.historial.length > 0 && ` (${socio.historial.length})`}
        </h3>
        {socio.historial.length === 0 ? (
          <p className="apagado">
            No ha venido todavía desde que se hizo socio. La tarjeta está sin estrenar.
          </p>
        ) : (
          <ul className="ficha-socio__lista">
            {socio.historial.map((v) => (
              <li key={v.id}>
                <span>{enCorto(v.fecha)}</span>
                <span className="apagado">
                  {v.local}
                  {v.nota ? ` · ${v.nota}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
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
