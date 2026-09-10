import { useDatos } from '../useDatos.js';
import { adminApi } from '../api.js';
import { Aviso } from './Campos.jsx';

/**
 * Cuantas reservas entran por la web.
 *
 * Es la unica cifra que dice si la web sirve para algo, y hasta ahora habia
 * que contar filas a mano para saberla.
 *
 * UNA SOLA SERIE a proposito. La primera version iba a pintar web, WhatsApp y
 * telefono en la misma barra, pero la pregunta no es "por donde entran las
 * reservas", es "cuantas entran por la web": con tres colores hay que buscar
 * el que interesa antes de leer nada. El reparto va arriba en numeros, que
 * para tres cifras se lee antes que una leyenda.
 *
 * El mes se cuenta por la FECHA DE LA RESERVA y no por cuando se pidio: lo
 * que le importa a una casa es cuanta gente se sento en marzo, no cuanta
 * escribio en marzo para venir en abril.
 */

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function nombreDeMes(clave) {
  const [anio, mes] = clave.split('-');
  return `${MES[Number(mes) - 1]} ${anio.slice(2)}`;
}

/**
 * Una fila de barra.
 *
 * El numero va SIEMPRE escrito al lado, no solo al pasar el raton: en una
 * pantalla que se mira de reojo entre servicio y servicio, obligar a apuntar
 * con el raton para saber cuanto vale una barra es no dar el dato.
 */
function Barra({ etiqueta, valor, maximo, titulo }) {
  const porcentaje = maximo > 0 ? Math.round((valor / maximo) * 100) : 0;

  return (
    <li className="barra" title={titulo}>
      <span className="barra__etiqueta">{etiqueta}</span>
      <span className="barra__carril">
        <span className="barra__relleno" style={{ width: `${porcentaje}%` }} />
      </span>
      <span className="barra__valor">{valor}</span>
    </li>
  );
}

export default function ReservasPorLaWeb() {
  const { datos, cargando, error } = useDatos(() => adminApi.estadisticasReservas(12), []);

  if (cargando && !datos) return <p className="admin-cargando">Contando reservas...</p>;

  return (
    <>
      <Aviso tipo="error">{error?.message}</Aviso>
      {datos && <Contenido datos={datos} />}
    </>
  );
}

function Contenido({ datos }) {
  const { resumen, porMes, porLocal, comoAcaban } = datos;

  if (resumen.total === 0) {
    return (
      <p className="admin-vacio">
        Todavía no ha entrado ninguna reserva.
        <br />
        Cuando entre la primera aparecerá aquí, con el reparto por mes y por casa.
      </p>
    );
  }

  const topMes = Math.max(...porMes.map((m) => m.web), 1);
  const topLocal = Math.max(...porLocal.map((l) => l.web), 1);

  return (
    <>
      {/*
        El titular es un numero, no una grafica. Es la respuesta a la unica
        pregunta que se viene a hacer aqui, y una grafica para contestar
        "cuantas" obliga a leer un eje para sacar un numero que cabe entero.
      */}
      <div className="cifras">
        <p className="cifra">
          <span className="cifra__numero">{resumen.web}</span>
          <span className="cifra__que">reservas por la web</span>
          <span className="cifra__nota">
            {resumen.porcentajeWeb === null
              ? 'sin reservas todavía'
              : `${resumen.porcentajeWeb}% de las ${resumen.total} del grupo`}
          </span>
        </p>
        <p className="cifra">
          <span className="cifra__numero">{resumen.comensalesWeb}</span>
          <span className="cifra__que">comensales</span>
          <span className="cifra__nota">sentados gracias a la web</span>
        </p>
        <p className="cifra cifra--menor">
          <span className="cifra__que">Por otros caminos</span>
          <span className="cifra__nota">
            WhatsApp {resumen.whatsapp} · teléfono {resumen.telefono}
          </span>
        </p>
      </div>

      <div className="estado-bloques">
        <section className="bloque-dato">
          <h3>Por mes</h3>
          <ul className="barras">
            {porMes.map((m) => (
              <Barra
                key={m.mes}
                etiqueta={nombreDeMes(m.mes)}
                valor={m.web}
                maximo={topMes}
                titulo={`${m.web} por la web de ${m.total} en total · ${m.comensalesWeb} comensales`}
              />
            ))}
          </ul>
        </section>

        <section className="bloque-dato">
          <h3>Por casa</h3>
          <ul className="barras">
            {porLocal.map((l) => (
              <Barra
                key={l.slug}
                etiqueta={l.nombre}
                valor={l.web}
                maximo={topLocal}
                titulo={`${l.web} por la web de ${l.total} en total`}
              />
            ))}
          </ul>
        </section>

        <section className="bloque-dato">
          <h3>Cómo acaban</h3>
          {/*
            Sirve para saber si la web trae gente o trae ruido: muchas
            reservas y muchos "no se presentó" no es una web que funciona, es
            una web que ocupa mesas.
          */}
          <ul className="estado-lineas">
            <li className="estado-linea">
              <span className="estado-linea__que">Confirmadas</span>
              <span className="estado-linea__valor es-si">{comoAcaban.confirmada}</span>
            </li>
            <li className="estado-linea">
              <span className="estado-linea__que">Sin confirmar todavía</span>
              <span className="estado-linea__valor">{comoAcaban.pendiente}</span>
            </li>
            <li className="estado-linea">
              <span className="estado-linea__que">Canceladas</span>
              <span className="estado-linea__valor">{comoAcaban.cancelada}</span>
            </li>
            <li className="estado-linea">
              <span className="estado-linea__que">No se presentaron</span>
              <span className={`estado-linea__valor ${comoAcaban.no_presentado > 0 ? 'es-no' : ''}`}>
                {comoAcaban.no_presentado}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <p className="apagado" style={{ fontSize: '0.85rem' }}>
        Últimos {datos.meses} meses, contando por la fecha de la reserva. No se cuentan
        las canceladas salvo donde lo dice.
      </p>
    </>
  );
}
