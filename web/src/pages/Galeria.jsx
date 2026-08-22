import { lazy, Suspense, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useMetadatos } from '../hooks/useMetadatos.js';
import { api } from '../api/client.js';
import { Cargando, Error } from '../components/Estado.jsx';
import BarraReserva from '../components/BarraReserva.jsx';

// El visor solo hace falta cuando alguien pulsa una foto.
const Visor = lazy(() => import('../components/Visor.jsx'));

const ETIQUETAS = {
  plato: 'Platos',
  local: 'El local',
  equipo: 'El equipo',
  evento: 'Celebraciones',
};

/**
 * Galeria. Sirve para la del grupo (/galeria) y para la de un local
 * (/:slug/galeria): lo unico que cambia es de donde salen las fotos.
 */
export default function Galeria() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const categoria = params.get('categoria');
  const [abierta, setAbierta] = useState(null);

  const local = useApi((opts) => (slug ? api.restaurante(slug, opts) : Promise.resolve(null)), [slug]);
  const galeria = useApi((opts) => api.galeria(slug, categoria, opts), [slug, categoria]);

  const nombre = local.datos?.nombre ?? 'Grupo Cobama';

  useMetadatos({
    titulo: slug ? `Fotos de ${nombre} · Grupo Cobama` : 'Galeria · Grupo Cobama',
    descripcion: slug
      ? `Fotos de ${nombre}: sus platos, el local y sus celebraciones.`
      : 'Fotos de los cuatro locales del Grupo Cobama: platos, salas y celebraciones.',
  });

  const fotos = useMemo(() => galeria.datos?.fotos ?? [], [galeria.datos]);
  const conteos = galeria.datos?.categorias ?? {};

  const filtrar = (valor) => {
    const siguiente = new URLSearchParams(params);
    if (valor) siguiente.set('categoria', valor);
    else siguiente.delete('categoria');
    setParams(siguiente, { replace: true });
  };

  return (
    <>
      <section className="seccion">
        <div className="contenedor">
          <h1>{slug ? `Fotos de ${nombre}` : 'Galeria'}</h1>
          <p className="apagado">
            {slug
              ? 'Los platos, la sala y lo que se cuece por aqui.'
              : 'Las cuatro casas: sus platos, sus salas y sus celebraciones.'}
          </p>

          {Object.keys(conteos).length > 1 && (
            <div className="filtros" style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className={`filtro ${!categoria ? 'filtro--activo' : ''}`}
                onClick={() => filtrar(null)}
              >
                Todo
              </button>
              {Object.entries(conteos).map(([clave, total]) => (
                <button
                  key={clave}
                  type="button"
                  className={`filtro ${categoria === clave ? 'filtro--activo' : ''}`}
                  onClick={() => filtrar(clave)}
                >
                  {ETIQUETAS[clave] ?? clave} <span className="apagado">{total}</span>
                </button>
              ))}
            </div>
          )}

          {galeria.error ? (
            <Error error={galeria.error} />
          ) : galeria.cargando ? (
            <Cargando texto="Cargando fotos..." />
          ) : fotos.length === 0 ? (
            <p className="aviso" style={{ marginTop: '1.5rem' }}>
              Todavia no hay fotos publicadas aqui.
            </p>
          ) : (
            <ul className="galeria">
              {fotos.map((foto, i) => (
                <li key={foto.id} className="galeria__hueco">
                  <button
                    type="button"
                    className="galeria__foto"
                    onClick={() => setAbierta(i)}
                    aria-label={`Ampliar: ${foto.alt ?? foto.titulo ?? 'foto'}`}
                  >
                    <img
                      src={foto.imagen_thumb}
                      // width y height de verdad para que el navegador reserve
                      // el hueco exacto. Sin ellos la pagina da saltos segun
                      // cargan las fotos y se pierde de vista lo que leias.
                      width={foto.ancho}
                      height={foto.alto}
                      alt={foto.alt ?? ''}
                      loading="lazy"
                      decoding="async"
                    />
                    {foto.titulo && <span className="galeria__pie">{foto.titulo}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!slug && (
            <p className="apagado" style={{ marginTop: '2rem', fontSize: '0.9rem' }}>
              Cada casa tiene la suya:{' '}
              <Link to="/como-en-casa/galeria">Como en Casa</Link>,{' '}
              <Link to="/la-basilica/galeria">La Basilica</Link>,{' '}
              <Link to="/la-casa-del-mago/galeria">La Casa del Mago</Link> y{' '}
              <Link to="/el-descarado/galeria">El Descarado</Link>.
            </p>
          )}
        </div>
      </section>

      {abierta !== null && (
        <Suspense fallback={null}>
          <Visor
            fotos={fotos}
            indice={abierta}
            onCerrar={() => setAbierta(null)}
            onCambiar={setAbierta}
          />
        </Suspense>
      )}

      {slug && <BarraReserva local={local.datos} />}
    </>
  );
}
