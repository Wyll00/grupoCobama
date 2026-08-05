import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { adminApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import { Aviso, Seleccion } from '../componentes/Campos.jsx';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
// Lunes primero, como se lee una semana en Espana.
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

const NIVELES = ['Vacio', 'Flojo', 'Normal', 'Lleno', 'A tope'];

export default function Ocupacion() {
  const { esAdmin, localFijo } = useAuth();
  const [params, setParams] = useSearchParams();
  const [dias, setDias] = useState(90);

  const locales = useDatos(() => adminApi.restaurantes(), []);
  const listaLocales = locales.datos ?? [];

  const localId = esAdmin ? Number(params.get('local')) || listaLocales[0]?.id : localFijo;

  const patron = useDatos(
    () => (localId ? adminApi.ocupacionPatron(localId, dias) : Promise.resolve(null)),
    [localId, dias]
  );
  const historico = useDatos(
    () => (localId ? adminApi.ocupacionHistorico(localId, 14) : Promise.resolve([])),
    [localId]
  );

  const celdas = patron.datos?.celdas ?? [];
  const registros = historico.datos ?? [];

  // Solo se pintan las horas con datos: una rejilla de 24 columnas en un local
  // que abre siete horas es casi toda hueco.
  const horas = [...new Set(celdas.map((c) => c.hora))].sort((a, b) => a - b);
  const porClave = new Map(celdas.map((c) => [`${c.dia_semana}-${c.hora}`, c]));

  const enLocal = (fecha) =>
    new Date(fecha.replace(' ', 'T') + 'Z').toLocaleString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Ocupacion</h1>
          <p className="apagado">
            Cada hora, sala responde desde el comandero como esta el local. Con eso salen
            las horas punta reales de esta casa.
          </p>
        </div>

        <div className="pagina__acciones">
          {esAdmin && (
            <Seleccion
              value={localId ?? ''}
              onChange={(e) => setParams({ local: e.target.value })}
              aria-label="Local"
            >
              {listaLocales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </Seleccion>
          )}
          <Seleccion
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            aria-label="Periodo"
          >
            <option value={30}>Ultimos 30 dias</option>
            <option value={90}>Ultimos 90 dias</option>
            <option value={365}>Ultimo ano</option>
          </Seleccion>
        </div>
      </header>

      <Aviso tipo="error">{patron.error?.message}</Aviso>

      {patron.datos?.resumen.lecturas === 0 ? (
        <p className="admin-vacio">
          Todavia no hay lecturas de este local.
          <br />
          Aparecen aqui segun sala vaya respondiendo el aviso del comandero.
        </p>
      ) : (
        <>
          <p className="apagado nota-seccion">
            {patron.datos?.resumen.lecturas}{' '}
            {patron.datos?.resumen.lecturas === 1 ? 'lectura' : 'lecturas'} · media general{' '}
            <strong>{patron.datos?.resumen.media}</strong> sobre 4
          </p>

          <div className="mapa-aforo">
            <table className="tabla tabla--compacta">
              <thead>
                <tr>
                  <th />
                  {horas.map((h) => (
                    <th key={h} className="tabla__centro">
                      {String(h).padStart(2, '0')}h
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ORDEN_DIAS.map((dia) => (
                  <tr key={dia}>
                    <th scope="row">{DIAS[dia]}</th>
                    {horas.map((h) => {
                      const celda = porClave.get(`${dia}-${h}`);
                      if (!celda) {
                        return <td key={h} className="celda-aforo celda-aforo--sin-datos" />;
                      }
                      // La media 0..4 se lleva a una opacidad para que el color
                      // diga por si solo donde esta la hora punta.
                      const intensidad = 0.15 + (celda.media / 4) * 0.85;
                      return (
                        <td
                          key={h}
                          className="celda-aforo"
                          style={{ '--intensidad': intensidad }}
                          title={`${DIAS[dia]} ${h}h · media ${celda.media} de 4 · ${celda.lecturas} lectura${celda.lecturas > 1 ? 's' : ''}`}
                        >
                          {celda.media.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="apagado nota-seccion">
            Media de 0 (vacio) a 4 (a tope). Las casillas en blanco son horas sin ninguna
            lectura todavia.
          </p>
        </>
      )}

      <h2 className="subtitulo">Ultimas lecturas</h2>

      {registros.length === 0 ? (
        <p className="admin-vacio">Sin lecturas en los ultimos 14 dias.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Cuando</th>
              <th>Nivel</th>
              <th className="tabla__centro">Comensales</th>
              <th>Nota</th>
              <th>Quien</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id}>
                <td>{enLocal(r.tramo)}</td>
                <td>
                  <span className={`punto punto--nivel-${r.nivel}`}>{NIVELES[r.nivel]}</span>
                </td>
                <td className="tabla__centro apagado">{r.comensales ?? '—'}</td>
                <td className="apagado">{r.nota ?? '—'}</td>
                <td className="apagado">{r.usuario_nombre ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
