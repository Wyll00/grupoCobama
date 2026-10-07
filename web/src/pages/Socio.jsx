import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useSocio } from '../hooks/useSocio.js';
import { api } from '../api/client.js';
import { Cargando, Error } from '../components/Estado.jsx';
import TarjetaSocio from '../components/TarjetaSocio.jsx';
import GuardarEnElMovil from '../components/GuardarEnElMovil.jsx';
import { useManifiesto } from '../hooks/useManifiesto.js';

/**
 * El perfil del socio: su zona dentro de la web.
 *
 * Entra escribiendo su codigo de tarjeta y el navegador lo recuerda, asi que a
 * partir de la segunda vez cae aqui directo. No es una cuenta con contrasena
 * -ver `useSocio.js` para lo que eso implica y lo que no-, pero se comporta
 * como una: se entra, se queda y se sale.
 *
 * El orden de la pagina es el de las preguntas que trae quien la abre:
 *
 *   1. Cuanto llevo              -> la cuenta grande, arriba
 *   2. Que tengo que ensenar     -> la tarjeta
 *   3. Que he ganado             -> los premios
 *   4. Cuando he venido          -> las visitas
 *
 * La tarjeta no va la primera aunque sea lo mas vistoso: quien abre su perfil
 * en casa viene a ver cuanto le falta, y quien lo abre en la puerta ya tiene
 * la tarjeta a un dedo de distancia.
 */

/** Las iniciales, para el circulo de arriba. */
function iniciales(nombre) {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** "sáb 3", para el detalle de cada visita dentro de su mes. */
const enCortito = (fecha) =>
  new Date(`${fecha}T12:00:00Z`).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
  });

/**
 * Parte el historial en meses, SIN reordenar.
 *
 * La API ya lo manda de la mas reciente a la mas vieja; aqui solo se corta.
 * Con un `Map` y no con un objeto a secas porque el `Map` conserva el orden de
 * insercion sea cual sea la clave, y un objeto no lo garantiza.
 */
function porMeses(historial) {
  const meses = new Map();

  for (const visita of historial) {
    const mes = new Date(`${visita.fecha}T12:00:00Z`).toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
    if (!meses.has(mes)) meses.set(mes, []);
    meses.get(mes).push(visita);
  }

  return [...meses];
}

export default function Socio() {
  const { codigo } = useParams();
  const { codigo: recordado, entrar, salir } = useSocio();
  const navegar = useNavigate();

  const { datos: perfil, cargando, error } = useApi((opts) => api.socio(codigo, opts), [codigo]);

  /*
    Mientras se mira la tarjeta, el manifiesto es el de la tarjeta.

    Va ANTES de los `return` de error y carga a proposito: los hooks se llaman
    siempre en el mismo orden o React se queja, y ademas da igual que la
    peticion falle; si alguien guarda la pagina en ese momento, lo que tiene
    que guardarse sigue siendo su tarjeta.
  */
  useManifiesto('/manifest-socio.webmanifest');

  /*
    Al abrir un perfil que carga bien, se recuerda.

    Es lo que hace que el QR de la tarjeta sirva de "entrar": el cliente lo
    escanea una vez y a partir de ahi la web ya sabe quien es. Solo se recuerda
    si la peticion fue BIEN: un codigo mal escrito no debe quedarse guardado y
    mandar a un error cada vez que vuelva.
  */
  useEffect(() => {
    if (perfil?.codigo) entrar(perfil.codigo);
  }, [perfil?.codigo, entrar]);

  if (error) return <Error error={error} />;
  if (cargando) return <Cargando texto="Abriendo tu perfil..." />;

  const premiosPendientes = perfil.premios.filter((p) => !p.entregado_en);
  const premiosEntregados = perfil.premios.filter((p) => p.entregado_en);

  /*
    En que casa ha venido mas.

    Dos cautelas, porque las dos dan un dato falso:

      - Con una sola visita no se ensena. "Tu casa favorita" con una visita no
        es un dato, es una ocurrencia.
      - Con un EMPATE tampoco. Ordenar y coger el primero siempre devuelve
        algo, y con 2 y 2 ese algo es el orden en que llegaron las filas, no
        una preferencia del socio. Solo se ensena si gana de verdad.
  */
  const porCasa = perfil.historial.reduce((cuenta, v) => {
    cuenta[v.local] = (cuenta[v.local] ?? 0) + 1;
    return cuenta;
  }, {});
  const ordenadas = Object.entries(porCasa).sort((a, b) => b[1] - a[1]);
  const hayGanadora = ordenadas.length === 1 || (ordenadas[1] && ordenadas[0][1] > ordenadas[1][1]);
  const favorita = hayGanadora ? ordenadas[0] : null;

  const cerrar = () => {
    salir();
    navegar('/socio');
  };

  return (
    <section className="seccion perfil">
      <div className="contenedor">
        <header className="perfil__cabecera">
          <span className="perfil__avatar" aria-hidden="true">
            {iniciales(perfil.nombre)}
          </span>
          <div className="perfil__identidad">
            <h1>{perfil.nombre}</h1>
            <p className="apagado">
              Socio desde{' '}
              {new Date(perfil.socioDesde).toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric',
              })}
              {perfil.altaEn && ` · ${perfil.altaEn.nombre}`}
            </p>
          </div>
          {recordado && (
            <button type="button" className="enlace perfil__salir" onClick={cerrar}>
              Salir
            </button>
          )}
        </header>

        {/* Las tres cifras, antes que nada. */}
        <div className="perfil__cifras">
          <p className="cifra-perfil">
            <strong>{perfil.visitas}</strong>
            <span>{perfil.visitas === 1 ? 'visita' : 'visitas'}</span>
          </p>
          <p className="cifra-perfil">
            <strong>{perfil.premiosGanados}</strong>
            <span>{perfil.premiosGanados === 1 ? 'premio' : 'premios'}</span>
          </p>
          <p className="cifra-perfil">
            <strong>{perfil.premiosPendientes > 0 ? '¡Ya!' : perfil.faltan}</strong>
            <span>{perfil.premiosPendientes > 0 ? 'por canjear' : 'para el siguiente'}</span>
          </p>
        </div>

        {favorita && favorita[1] > 1 && (
          <p className="perfil__favorita">
            Donde más vienes: <strong>{favorita[0]}</strong> ({favorita[1]} visitas)
          </p>
        )}
      </div>

      <div className="perfil__tarjeta">
        <TarjetaSocio tarjeta={perfil} />
        <GuardarEnElMovil />
      </div>

      <div className="contenedor perfil__columnas">
        <section>
          <h2>Tus premios</h2>
          {perfil.premios.length === 0 ? (
            /*
              Antes aqui habia una frase y nada mas -"todavia ninguno"-, que en
              pantalla ancha dejaba media pagina vacia al lado de una columna
              llena. Y sobre todo no decia nada que no se supiera ya.

              Lo que si es informacion nueva: que los premios NO son uno y se
              acabo, sino uno cada ocho visitas. Eso no lo cuenta la tarjeta de
              arriba, que solo ensena el tramo en curso.
            */
            <div className="siguiente-premio">
              <p className="siguiente-premio__cuando">
                A las {perfil.visitasParaElPremio} visitas
              </p>
              <p className="siguiente-premio__que">Tu primer premio</p>

              {/* La barra repite el dato de los sellos, pero aqui mide contra
                  el primer premio y alli contra el tramo: para quien aun no ha
                  llegado nunca son el mismo numero, y asi esta columna dice
                  cuanto falta sin tener que subir a mirar. */}
              <div
                className="barra-premio"
                role="img"
                aria-label={`${perfil.visitas} de ${perfil.visitasParaElPremio} visitas`}
              >
                <span
                  className="barra-premio__hecho"
                  style={{
                    inlineSize: `${Math.min(100, (perfil.visitas / perfil.visitasParaElPremio) * 100)}%`,
                  }}
                />
              </div>

              <p className="siguiente-premio__falta">
                {perfil.visitas === 0
                  ? 'Enseña tu tarjeta la próxima vez que vengas.'
                  : perfil.faltan === 1
                    ? 'Te falta 1 visita.'
                    : `Te faltan ${perfil.faltan} visitas.`}
              </p>
              <p className="siguiente-premio__luego">
                Y después, uno cada {perfil.visitasParaElPremio}.
              </p>
            </div>
          ) : (
            <ul className="premios">
              {/* Los de verdad primero: lo que hay que hacer algo con ello va
                  antes que el historial de lo ya hecho. */}
              {premiosPendientes.map((p) => (
                <li key={p.id} className="premio premio--pendiente">
                  <span className="premio__que">
                    <strong>Premio sin canjear</strong>
                    <span className="premio__cuando">Conseguido con {p.visitas} visitas</span>
                  </span>
                  <span className="premio__sello">Pídelo en tu próxima visita</span>
                </li>
              ))}
              {premiosEntregados.map((p) => (
                <li key={p.id} className="premio">
                  <span className="premio__que">
                    <strong>Premio canjeado</strong>
                    <span className="premio__cuando">
                      Con {p.visitas} visitas
                      {p.entregado_nota ? ` · ${p.entregado_nota}` : ''}
                    </span>
                  </span>
                  <span className="premio__fecha">
                    {new Date(p.entregado_en).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Tus visitas</h2>
          {perfil.historial.length === 0 ? (
            <p className="apagado">
              Aún no hay ninguna apuntada. Enseña tu tarjeta la próxima vez que vengas.
            </p>
          ) : (
            /*
              Agrupadas por mes.

              Una lista de catorce fechas seguidas no se lee, se escanea sin
              encontrar nada. Con el mes de titulillo, "este mes he venido
              tres veces" se ve sin contar, que es la pregunta que trae quien
              abre esto.

              Y el que manda en cada linea es LA CASA, no la fecha: antes la
              casa iba subrayada a la derecha, como un enlace suelto, y la
              fecha en gris a la izquierda; las dos peleando y ninguna
              ganando. Ahora la casa es el renglon y la fecha su detalle, y lo
              que se pulsa es la fila entera.
            */
            porMeses(perfil.historial).map(([mes, visitas]) => (
              <div key={mes} className="mes-visitas">
                <h3 className="mes-visitas__titulo">
                  {mes}
                  <span className="mes-visitas__cuantas">
                    {visitas.length} {visitas.length === 1 ? 'visita' : 'visitas'}
                  </span>
                </h3>
                <ul className="visitas">
                  {visitas.map((v) => (
                    <li key={v.id}>
                      <Link className="visita" to={`/${v.slug}`}>
                        <span className="visita__local">{v.local}</span>
                        <span className="visita__dia">{enCortito(v.fecha)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>
    </section>
  );
}
