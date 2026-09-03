import { adminApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import { Aviso } from '../componentes/Campos.jsx';
import IconoAlergeno from '../../components/IconoAlergeno.jsx';

/**
 * Estadisticas de la carta.
 *
 * De momento solo el mapa de alergenos. Las cifras de reservas, ocupacion o
 * evolucion de precios no caben todavia: con cinco reservas y cero registros de
 * ocupacion saldrian graficas vacias, y una pantalla llena de ceros parece un
 * producto sin usar aunque el producto este bien.
 */
export default function Estadisticas() {
  const mapa = useDatos(() => adminApi.mapaAlergenos(), []);
  const d = mapa.datos;

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Estadisticas de la carta</h1>
          <p className="apagado">
            Que puede comer alguien con una intolerancia, plato a plato.
          </p>
        </div>
      </header>

      <Aviso tipo="error">{mapa.error?.message}</Aviso>

      {d && (
        <>
          <section className="panel-resumen">
            <h2>Cobertura</h2>
            <p className="apagado">
              De <strong>{d.en_carta}</strong> platos servidos,{' '}
              <strong>{d.con_datos}</strong> tienen informacion de alergenos.
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
              Sobre los {d.con_datos} platos con informacion. Los que no la tienen
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
    </>
  );
}
