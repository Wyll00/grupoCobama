import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { adminApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import { Aviso } from '../componentes/Campos.jsx';
import PortadaLocal from '../componentes/PortadaLocal.jsx';
import ReservasExternas from '../componentes/ReservasExternas.jsx';

export default function Panel() {
  const { usuario, esAdmin, localFijo } = useAuth();
  const locales = useDatos(() => adminApi.restaurantes(), []);
  const catalogo = useDatos(() => adminApi.platos({ porPagina: 1 }), []);
  const pendiente = useDatos(() => adminApi.resumen(), []);

  const visibles = (locales.datos ?? []).filter((l) => esAdmin || l.id === localFijo);

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Hola, {usuario?.nombre?.split(' ')[0]}</h1>
          <p className="apagado">
            {esAdmin
              ? 'Tienes acceso a los cuatro locales y al catalogo maestro.'
              : 'Gestionas la carta y los precios de tu local.'}
          </p>
        </div>
      </header>

      <Aviso tipo="error">{locales.error?.message}</Aviso>

      {/* Lo que falta por rematar.
          Antes el panel solo abria puertas; ahora dice tambien por donde
          empezar. Solo salen las lineas con algo pendiente: una lista de
          tareas llena de ceros se deja de mirar a los dos dias. */}
      {pendiente.datos && (
        <section className="pendientes-panel">
          {(() => {
            const d = pendiente.datos;
            const tareas = [
              // Los alergenos van primero y en rojo: son obligatorios por ley,
              // no una mejora estetica como la foto.
              //
              // Cuenta solo lo que de verdad esta sin hacer: ni alergenos
              // puestos ni confirmacion de que no lleva. Un plato con sus
              // alergenos asignados ya esta resuelto, y el agua mineral se
              // quita de la lista pulsando confirmar una vez.
              { n: d.alergenos_pendientes, grave: true, texto: 'sin alergenos ni confirmar', a: '/admin/platos?falta=alergenos' },
              { n: d.reservas_pendientes, texto: 'reservas por confirmar', a: '/admin/reservas' },
              { n: d.sin_traducir, texto: 'sin traducir', a: '/admin/platos?falta=idiomas' },
              { n: d.sin_foto, texto: 'sin foto', a: '/admin/platos?falta=foto' },
              { n: d.agotados, texto: 'agotados hoy', a: '/admin/carta' },
              { n: d.fuera_de_carta, texto: 'fuera de toda carta', a: '/admin/platos?falta=carta' },
            ].filter((t) => t.n > 0);

            if (tareas.length === 0) {
              return <p className="pendientes-panel__ok">La carta esta al dia. Nada pendiente.</p>;
            }
            return (
              <ul className="pendientes-panel__lista">
                {tareas.map((t) => (
                  <li key={t.texto}>
                    <Link to={t.a} className={t.grave ? 'pendiente pendiente--grave' : 'pendiente'}>
                      <strong>{t.n}</strong>
                      <span>{t.texto}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            );
          })()}
        </section>
      )}

      <section className="tarjetas-panel">
        {visibles.map((local) => (
          <article key={local.id} className="tarjeta-panel">
            <header>
              <h2>{local.nombre}</h2>
              <span className={`punto ${local.abierto_ahora ? 'punto--si' : 'punto--no'}`}>
                {local.abierto_ahora ? 'Abierto' : 'Cerrado'}
              </span>
            </header>
            <p className="apagado">{local.municipio}</p>
            {/* Miniatura de la portada: se ve de un vistazo cual de los cuatro
                locales todavia no tiene foto. */}
            {local.imagen_portada ? (
              <img className="tarjeta-panel__portada" src={local.imagen_portada} alt="" />
            ) : (
              <div className="tarjeta-panel__portada tarjeta-panel__portada--vacia">
                Sin foto de portada
              </div>
            )}

            <div className="tarjeta-panel__acciones">
              <Link className="btn btn--principal" to={`/admin/carta?local=${local.id}`}>
                Gestionar carta
              </Link>
              <a
                className="btn btn--secundario"
                href={`/${local.slug}/carta`}
                target="_blank"
                rel="noreferrer"
              >
                Ver publica
              </a>
              <PortadaLocal local={local} onCambio={() => locales.recargar()} />
              <ReservasExternas local={local} onCambio={() => locales.recargar()} />
            </div>
          </article>
        ))}
      </section>

      {esAdmin && (
        <section className="panel-resumen">
          <h2>Catalogo maestro</h2>
          <p className="apagado">
            {catalogo.datos
              ? `${catalogo.datos.paginacion.total} platos dados de alta en el grupo.`
              : 'Cargando...'}{' '}
            Un plato se crea una vez aqui y cada local decide si lo sirve y a que precio.
          </p>
          <Link className="btn btn--secundario" to="/admin/platos">
            Ir al catalogo
          </Link>
        </section>
      )}
    </>
  );
}
