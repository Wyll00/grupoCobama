import { useDatos } from '../useDatos.js';
import { adminApi } from '../api.js';
import { Aviso, Boton } from '../componentes/Campos.jsx';

/**
 * Qué está conectado y qué hay que hacer a mano.
 *
 * Una revisión externa no pudo comprobar si las reservas llegan a
 * CoverManager y se quedó con la duda de cuánto trabajo manual había detrás.
 * Esta pantalla contesta esas dos preguntas mirando el sistema que está
 * corriendo, no el código: se abre desde el panel, sin entrar al servidor.
 *
 * Está escrita para no engañar. Cuando algo no está conectado dice qué
 * significa y quién tiene que suplirlo mientras tanto. Un panel que pusiera
 * "todo correcto" mientras los avisos se escriben en una carpeta sería peor
 * que no tener panel: da una tranquilidad que no se corresponde con nada.
 */

const NIVELES = {
  // Rojo solo para lo que puede acabar en dos mesas vendidas a la vez. Si se
  // pinta de rojo tambien lo informativo, sala deja de mirar los rojos.
  error: { clase: 'estado-aviso--error', marca: '!' },
  aviso: { clase: 'estado-aviso--ojo', marca: '!' },
  info: { clase: 'estado-aviso--info', marca: 'i' },
};

function AvisoEstado({ aviso }) {
  const n = NIVELES[aviso.nivel] ?? NIVELES.info;

  return (
    <li className={`estado-aviso ${n.clase}`}>
      <span className="estado-aviso__marca" aria-hidden="true">
        {n.marca}
      </span>
      <div>
        <p className="estado-aviso__titulo">{aviso.titulo}</p>
        <p className="estado-aviso__detalle">{aviso.detalle}</p>
        {aviso.manual && (
          <p className="estado-aviso__manual">
            <strong>A mano:</strong> {aviso.manual}
          </p>
        )}
      </div>
    </li>
  );
}

function Linea({ que, valor, bien }) {
  return (
    <li className="estado-linea">
      <span className="estado-linea__que">{que}</span>
      <span className={`estado-linea__valor ${bien ? 'es-si' : 'es-no'}`}>{valor}</span>
    </li>
  );
}

export default function Estado() {
  const { datos, cargando, error, recargar } = useDatos(() => adminApi.estado(), []);

  if (cargando && !datos) return <p className="admin-cargando">Comprobando el estado...</p>;

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Estado del sistema</h1>
          <p className="apagado">
            Qué está conectado, qué no, y qué tiene que hacer alguien a mano mientras tanto.
          </p>
        </div>
        <Boton onClick={recargar} disabled={cargando}>
          {cargando ? 'Comprobando...' : 'Volver a comprobar'}
        </Boton>
      </header>

      <Aviso tipo="error">{error?.message}</Aviso>

      {datos && <Contenido datos={datos} />}
    </>
  );
}

function Contenido({ datos }) {
  const { covermanager: cm, correo, reservas, purga, avisos } = datos;

  return (
    <>
      {avisos.length === 0 ? (
        <p className="admin-vacio">Todo conectado y sin reservas pendientes.</p>
      ) : (
        <ul className="estado-avisos">
          {avisos.map((a) => (
            <AvisoEstado key={a.titulo} aviso={a} />
          ))}
        </ul>
      )}

      <div className="estado-bloques">
        <section className="bloque-dato">
          <h2>Reservas a CoverManager</h2>
          <ul className="estado-lineas">
            <Linea
              que="Integración configurada"
              valor={cm.configurado ? 'Sí' : 'No'}
              bien={cm.configurado}
            />
            <Linea
              que="Una reserva de hoy llegaría a su libro de mesas"
              valor={cm.enviaReservas ? 'Sí' : 'No'}
              bien={cm.enviaReservas}
            />
            <Linea
              que="Locales con identificador de CoverManager"
              valor={cm.localesConIdentificador.length || 'ninguno'}
              bien={cm.localesConIdentificador.length > 0}
            />
            <Linea
              que="Reservas enviadas correctamente"
              valor={cm.reservas.enviadas}
              bien={cm.reservas.conError === 0}
            />
            <Linea
              que="Reservas que fallaron al enviarse"
              valor={cm.reservas.conError}
              bien={cm.reservas.conError === 0}
            />
          </ul>

          {cm.localesQueReservanFuera.length > 0 && (
            <p className="apagado" style={{ fontSize: '0.875rem' }}>
              Estos locales no pasan por aquí, mandan al cliente a su propio sistema:{' '}
              {cm.localesQueReservanFuera.map((l) => l.slug).join(', ')}.
            </p>
          )}

          {/* Se dice aunque no sea agradable: es justo la pregunta que hizo la
              revision, y hoy la respuesta honesta es que no esta conectado. */}
          {!cm.configurado && (
            <p className="apagado" style={{ fontSize: '0.875rem' }}>
              Para encenderlo hacen falta la dirección y la clave que CoverManager da a
              sus clientes, y confirmar con su documentación cómo se llama cada campo.
              Hasta entonces, las reservas de la web viven solo aquí.
            </p>
          )}
        </section>

        <section className="bloque-dato">
          <h2>Avisos por correo</h2>
          <ul className="estado-lineas">
            <Linea
              que="Servidor de correo configurado"
              valor={correo.activo ? 'Sí' : 'No'}
              bien={correo.activo}
            />
            <Linea
              que="Qué pasa con cada aviso"
              valor={correo.activo ? 'se envía' : `se escribe en ${correo.carpeta}`}
              bien={correo.activo}
            />
          </ul>
        </section>

        <section className="bloque-dato">
          <h2>Reservas de la web</h2>
          <ul className="estado-lineas">
            <Linea
              que="Sin confirmar"
              valor={reservas.pendientes}
              bien={reservas.pendientes === 0}
            />
            {reservas.masAntigua && (
              <Linea
                que="La más antigua sin atender"
                valor={new Date(reservas.masAntigua.replace(' ', 'T')).toLocaleDateString(
                  'es-ES'
                )}
                bien={false}
              />
            )}
          </ul>
        </section>

        <section className="bloque-dato">
          <h2>Borrado de datos antiguos</h2>
          <ul className="estado-lineas">
            <Linea
              que={`Borrado automático a los ${purga.meses} meses`}
              valor={purga.programada ? 'Programado' : 'NO programado'}
              bien={purga.programada}
            />
          </ul>
          {!purga.programada && (
            <p className="apagado" style={{ fontSize: '0.875rem' }}>
              La política de privacidad promete que los datos de una reserva se guardan{' '}
              {purga.meses} meses. No hay ninguna tarea que los borre: hoy hay que
              hacerlo a mano.
            </p>
          )}
        </section>
      </div>

      <p className="apagado" style={{ fontSize: '0.8rem', marginTop: '1.5rem' }}>
        Comprobado el {new Date(datos.comprobadoEn).toLocaleString('es-ES')}.
      </p>
    </>
  );
}
