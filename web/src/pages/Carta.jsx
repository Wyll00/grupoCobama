import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useMetadatos } from '../hooks/useMetadatos.js';
import { api } from '../api/client.js';
import IconoAlergeno from '../components/IconoAlergeno.jsx';
import { Cargando, Error } from '../components/Estado.jsx';
import Plato from '../components/Plato.jsx';
import BarraReserva from '../components/BarraReserva.jsx';

export default function Carta() {
  const { slug } = useParams();
  // Los filtros viven en la URL: asi el enlace que comparte un cliente ya
  // llega con el filtro puesto.
  const [params, setParams] = useSearchParams();

  const categoria = params.get('categoria') ?? '';
  const busqueda = params.get('q') ?? '';
  const vegetariano = params.get('vegetariano') === '1';
  const vegano = params.get('vegano') === '1';
  const sinAlergenos = useMemo(
    () => (params.get('sin_alergenos') ?? '').split(',').filter(Boolean),
    [params]
  );

  const local = useApi((opts) => api.restaurante(slug, opts), [slug]);
  const alergenos = useApi((opts) => api.alergenos(opts), []);

  // La busqueda no dispara una peticion por tecla.
  const [textoBusqueda, setTextoBusqueda] = useState(busqueda);
  useEffect(() => setTextoBusqueda(busqueda), [busqueda]);
  useEffect(() => {
    if (textoBusqueda === busqueda) return;
    const id = setTimeout(() => actualizar('q', textoBusqueda || null), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoBusqueda]);

  // La categoria NO se manda a la API: una carta son ~30 platos, se filtra en
  // cliente y asi las pestanas no desaparecen al seleccionar una.
  const carta = useApi(
    (opts) =>
      api.carta(
        slug,
        {
          q: busqueda,
          vegetariano: vegetariano ? '1' : '',
          vegano: vegano ? '1' : '',
          sin_alergenos: sinAlergenos,
        },
        opts
      ),
    [slug, busqueda, vegetariano, vegano, sinAlergenos.join(',')]
  );

  function actualizar(clave, valor) {
    const siguientes = new URLSearchParams(params);
    if (valor === null || valor === '' || valor === false) siguientes.delete(clave);
    else siguientes.set(clave, valor);
    setParams(siguientes, { replace: true });
  }

  function alternarAlergeno(slugAlergeno) {
    const siguiente = sinAlergenos.includes(slugAlergeno)
      ? sinAlergenos.filter((a) => a !== slugAlergeno)
      : [...sinAlergenos, slugAlergeno];
    actualizar('sin_alergenos', siguiente.length ? siguiente.join(',') : null);
  }

  const hayFiltros = Boolean(busqueda || vegetariano || vegano || sinAlergenos.length);

  // Mismo formato que el titulo que sirve la API al prerenderizar. Cuando se
  // entra por primera vez manda el del servidor; esto es para la navegacion
  // dentro de la propia web, donde el servidor ya no interviene.
  useMetadatos({
    titulo: local.datos
      ? `Carta de ${local.datos.nombre} · ${local.datos.municipio} · Grupo Cobama`
      : undefined,
    descripcion: local.datos
      ? `Carta de ${local.datos.nombre}, en ${local.datos.municipio}. ${local.datos.reclamo ?? ''}`.trim()
      : undefined,
  });

  const todasLasCategorias = carta.datos?.categorias ?? [];
  const visibles = categoria
    ? todasLasCategorias.filter((c) => c.slug === categoria)
    : todasLasCategorias;
  const platosVisibles = visibles.reduce((n, c) => n + c.platos.length, 0);

  if (local.error) return <Error error={local.error} />;
  if (local.cargando) return <Cargando texto="Cargando la carta..." />;

  return (
    <>
      <section className="ficha__cabecera" style={{ paddingBlock: '2rem' }}>
        <div className="contenedor">
          <p className="tarjeta__municipio">
            <Link to={`/${slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {local.datos.nombre}
            </Link>{' '}
            · {local.datos.municipio}
          </p>
          <h1 style={{ marginBottom: '0.35rem' }}>Carta</h1>
        </div>
      </section>

      <div className="carta__barra">
        <div className="contenedor">
          <div className="pestanas">
            <button
              type="button"
              className={`pestana ${!categoria ? 'pestana--activa' : ''}`}
              onClick={() => actualizar('categoria', null)}
            >
              Todo
            </button>
            {todasLasCategorias.map((c) => (
              <button
                key={c.slug}
                type="button"
                className={`pestana ${categoria === c.slug ? 'pestana--activa' : ''}`}
                onClick={() => actualizar('categoria', categoria === c.slug ? null : c.slug)}
              >
                {c.nombre}
              </button>
            ))}
          </div>

          <details className="detalle-filtros" open={hayFiltros}>
            <summary>
              Buscar y filtrar
              {sinAlergenos.length > 0 &&
                ` · sin ${sinAlergenos.length} alergeno${sinAlergenos.length > 1 ? 's' : ''}`}
            </summary>

            <div className="detalle-filtros__contenido">
              <input
                type="search"
                className="buscador"
                placeholder="Buscar un plato..."
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
                aria-label="Buscar un plato"
              />

              <div className="filtros" style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className={`filtro filtro--dieta ${vegetariano ? 'filtro--activo' : ''}`}
                  onClick={() => actualizar('vegetariano', vegetariano ? null : '1')}
                  aria-pressed={vegetariano}
                >
                  Vegetariano
                </button>
                <button
                  type="button"
                  className={`filtro filtro--dieta ${vegano ? 'filtro--activo' : ''}`}
                  onClick={() => actualizar('vegano', vegano ? null : '1')}
                  aria-pressed={vegano}
                >
                  Vegano
                </button>
              </div>

              <p className="apagado" style={{ fontSize: '0.8rem', margin: '0.9rem 0 0.4rem' }}>
                Ocultar platos que contengan:
              </p>
              <div className="filtros">
                {(alergenos.datos ?? []).map((a) => (
                  <button
                    key={a.slug}
                    type="button"
                    className={`filtro ${sinAlergenos.includes(a.slug) ? 'filtro--activo' : ''}`}
                    onClick={() => alternarAlergeno(a.slug)}
                    aria-pressed={sinAlergenos.includes(a.slug)}
                  >
                    <IconoAlergeno alergeno={a} tamano={18} />
                    <span>{a.nombre}</span>
                  </button>
                ))}
              </div>

              <p className="filtros__aviso">
                Filtrar esconde platos, no garantiza que el resto sea apto: la cocina es
                compartida y puede haber contaminacion cruzada. Avisa siempre al personal.
              </p>

              {(hayFiltros || categoria) && (
                <button
                  type="button"
                  className="boton boton--secundario"
                  style={{ marginTop: '1rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setParams(new URLSearchParams(), { replace: true })}
                >
                  Quitar todos los filtros
                </button>
              )}
            </div>
          </details>
        </div>
      </div>

      <section className="seccion">
        <div className="contenedor">
          {carta.error ? (
            <Error error={carta.error} />
          ) : carta.cargando ? (
            <Cargando />
          ) : platosVisibles === 0 ? (
            <p className="vacio">
              Ningun plato encaja con estos filtros.
              <br />
              Prueba a quitar alguno.
            </p>
          ) : (
            visibles.map((c) => (
              <div key={c.id} className="categoria">
                <h2 id={c.slug} data-cuenta={`${c.platos.length} platos`}>
                  {c.nombre}
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {c.platos.map((plato) => (
                    <Plato key={plato.carta_item_id} plato={plato} />
                  ))}
                </ul>
              </div>
            ))
          )}

          <div className="aviso" style={{ marginTop: '2rem' }}>
            <strong>Alergias e intolerancias.</strong> La informacion de alergenos es
            orientativa y la cocina es compartida, por lo que no se puede descartar la
            contaminacion cruzada. Consulta siempre con el personal de sala.
          </div>
        </div>
      </section>

      <BarraReserva local={local.datos} />
    </>
  );
}
