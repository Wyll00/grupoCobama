import { adminApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import { Aviso } from '../componentes/Campos.jsx';
import IconoAlergeno from '../../components/IconoAlergeno.jsx';
import ReservasPorLaWeb from '../componentes/ReservasPorLaWeb.jsx';

/**
 * Estadisticas.
 *
 * Dos bloques y en este orden: primero las reservas que entran por la web,
 * que es lo que se viene a mirar, y debajo el mapa de alergenos de la carta.
 *
 * Las cifras de reservas estuvieron fuera un tiempo porque con cinco filas
 * saldrian graficas vacias. Se ponen igual: con pocas se ven pocas, y eso ya
 * es un dato. Lo que no se hace es inventar un cero bonito -sin ninguna
 * reserva la pantalla lo dice con palabras, no con una grafica plana-.
 */
export default function Estadisticas() {
  const mapa = useDatos(() => adminApi.mapaAlergenos(), []);
  const d = mapa.datos;

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Estadísticas</h1>
          <p className="apagado">
            Cuántas reservas entran por la web, y qué puede comer alguien con una
            intolerancia.
          </p>
        </div>
      </header>

      <section className="seccion-panel">
        <h2>Reservas por la web</h2>
        <ReservasPorLaWeb />
      </section>

      <section className="seccion-panel">
        <h2>Alérgenos de la carta</h2>

      <Aviso tipo="error">{mapa.error?.message}</Aviso>

      {d && (
        <>
          <section className="panel-resumen">
            <h2>Cobertura</h2>
            <p className="apagado">
              De <strong>{d.en_carta}</strong> platos servidos,{' '}
              <strong>{d.con_datos}</strong> tienen información de alérgenos.
              {d.sin_datos > 0 && (
                <>
                  {' '}Los <strong>{d.sin_datos}</strong> restantes no cuentan como aptos
                  para nadie: un plato del que nadie ha dicho nada no es un plato seguro,
                  es un plato sin mirar.
                </>
              )}
            </p>
          </section>

          <section className="mapa-alergenos">
            <h2>Los catorce declarables</h2>
            <p className="apagado">
              Sobre los {d.con_datos} platos con información. Los que no la tienen
              quedan fuera de la cuenta a proposito.
            </p>

            <ul className="mapa-alergenos__lista">
              {d.alergenos.map((a) => (
                <li key={a.id} className="alergeno-fila">
                  <div className="alergeno-fila__nombre">
                    {/* El componente compartido: sabe que los dibujos viven en
                        /alergenos/, y sin nombre los marca como decorativos
                        porque el texto va justo al lado. Mi <img> a pelo ponia
                        el src sin la carpeta y salia roto en /admin. */}
                    <IconoAlergeno alergeno={a} />
                    <span>{a.nombre}</span>
                  </div>

                  {/* La barra mide los platos que LO LLEVAN. Cuanto mas larga,
                      mas restrictivo es ese alergeno en esta carta. */}
                  <div className="alergeno-fila__barra" aria-hidden="true">
                    <div
                      style={{
                        width: d.con_datos ? `${(a.platos_con / d.con_datos) * 100}%` : '0%',
                      }}
                    />
                  </div>

                  <div className="alergeno-fila__cifras">
                    <strong>{a.platos_con}</strong>
                    <span className="apagado">lo llevan</span>
                    <strong className="verde">{a.platos_aptos}</strong>
                    <span className="apagado">aptos ({a.porcentaje_apto}%)</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      </section>
    </>
  );
}
