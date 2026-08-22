import { useRef, useState } from 'react';
import { useAuth } from '../auth.jsx';
import { adminApi, ErrorApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import { Aviso, Boton, Campo, Entrada, Seleccion } from '../componentes/Campos.jsx';

const CATEGORIAS = [
  { valor: 'plato', etiqueta: 'Platos' },
  { valor: 'local', etiqueta: 'El local' },
  { valor: 'equipo', etiqueta: 'El equipo' },
  { valor: 'evento', etiqueta: 'Celebraciones' },
];

/**
 * Galeria del panel.
 *
 * Un admin ve dos: la de cada local y la del grupo. Un encargado solo la
 * suya, y ademas ve las del grupo en gris, porque salen en su galeria publica
 * y conviene que sepa que estan ahi aunque no pueda tocarlas.
 */
export default function GaleriaAdmin() {
  const { esAdmin, localFijo } = useAuth();
  const locales = useDatos(() => adminApi.restaurantes(), []);

  const opciones = esAdmin
    ? [{ id: null, nombre: 'Grupo Cobama (sale en las cuatro casas)' }, ...(locales.datos ?? [])]
    : (locales.datos ?? []).filter((l) => l.id === localFijo);

  const [elegido, setElegido] = useState(undefined);
  const destino = elegido === undefined ? (esAdmin ? null : localFijo) : elegido;

  const fotos = useDatos(
    () => (destino === null ? adminApi.galeriaGrupo() : adminApi.galeriaLocal(destino)),
    [destino]
  );

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Galeria</h1>
          <p className="apagado">
            Las fotos que se ven en la web. Las del grupo salen ademas en la galeria de
            los cuatro locales.
          </p>
        </div>

        {opciones.length > 1 && (
          <Seleccion
            value={destino === null ? '' : String(destino)}
            onChange={(e) => setElegido(e.target.value === '' ? null : Number(e.target.value))}
          >
            {opciones.map((o) => (
              <option key={o.id ?? 'grupo'} value={o.id ?? ''}>
                {o.nombre}
              </option>
            ))}
          </Seleccion>
        )}
      </header>

      <Aviso tipo="error">{fotos.error?.message}</Aviso>

      <SubirFoto destino={destino} onSubida={() => fotos.recargar()} />

      {fotos.cargando ? (
        <p className="apagado">Cargando fotos...</p>
      ) : (fotos.datos ?? []).length === 0 ? (
        <p className="apagado">Todavia no hay fotos aqui. Sube la primera.</p>
      ) : (
        <ul className="galeria-admin">
          {fotos.datos.map((foto) => (
            <FichaFoto key={foto.id} foto={foto} onCambio={() => fotos.recargar()} />
          ))}
        </ul>
      )}
    </>
  );
}

function SubirFoto({ destino, onSubida }) {
  const entrada = useRef(null);
  const [categoria, setCategoria] = useState('local');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [hechas, setHechas] = useState(0);

  const subir = async (e) => {
    const ficheros = [...e.target.files];
    if (ficheros.length === 0) return;

    setSubiendo(true);
    setError(null);
    setHechas(0);

    // De una en una y no todas a la vez: cada foto se procesa con sharp en el
    // servidor y veinte a la vez lo tumban. Ademas asi se ve el avance.
    for (const fichero of ficheros) {
      const formData = new FormData();
      formData.append('imagen', fichero);
      formData.append('categoria', categoria);
      try {
        await adminApi.subirFoto(destino, formData);
        setHechas((n) => n + 1);
      } catch (err) {
        setError(
          `${fichero.name}: ${err instanceof ErrorApi ? err.message : 'no se ha podido subir'}`
        );
        break;
      }
    }

    setSubiendo(false);
    if (entrada.current) entrada.current.value = '';
    onSubida?.();
  };

  return (
    <div className="subir-fotos">
      <Campo etiqueta="Que son estas fotos" ayuda="Se puede cambiar despues, foto a foto.">
        <Seleccion value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.etiqueta}
            </option>
          ))}
        </Seleccion>
      </Campo>

      <label className="btn btn--principal">
        {subiendo ? `Subiendo... (${hechas})` : 'Subir fotos'}
        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          disabled={subiendo}
          onChange={subir}
        />
      </label>

      <p className="apagado subir-fotos__nota">
        Se pueden elegir varias de golpe. No hace falta recortarlas: aqui las fotos
        conservan su encuadre.
      </p>

      {error && <Aviso tipo="error">{error}</Aviso>}
    </div>
  );
}

function FichaFoto({ foto, onCambio }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [campos, setCampos] = useState({
    alt: foto.alt ?? '',
    titulo: foto.titulo ?? '',
    categoria: foto.categoria,
  });

  const cambiado =
    campos.alt !== (foto.alt ?? '') ||
    campos.titulo !== (foto.titulo ?? '') ||
    campos.categoria !== foto.categoria;

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      await adminApi.editarFoto(foto.id, campos);
      onCambio?.();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se ha podido guardar');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    if (!window.confirm('Se borra la foto y no se puede deshacer. Seguro?')) return;
    setGuardando(true);
    try {
      await adminApi.borrarFoto(foto.id);
      onCambio?.();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se ha podido borrar');
      setGuardando(false);
    }
  };

  return (
    <li className="galeria-admin__ficha">
      <img src={foto.imagen_thumb} alt={foto.alt ?? ''} loading="lazy" />

      <div className="galeria-admin__datos">
        {/* Una foto sin descripcion no existe para quien usa lector de
            pantalla ni para Google Imagenes. No se bloquea la subida por
            ello, pero tiene que verse que falta. */}
        {!foto.alt && (
          <p className="galeria-admin__pendiente">
            <strong>Sin describir.</strong> Quien no ve la foto no sabe que hay en ella,
            y los buscadores tampoco.
          </p>
        )}

        <Campo etiqueta="Que se ve en la foto" ayuda="Para lectores de pantalla y buscadores.">
          <Entrada
            value={campos.alt}
            onChange={(e) => setCampos((c) => ({ ...c, alt: e.target.value }))}
            placeholder="Ropa vieja de garbanzas servida en cazuela de barro"
          />
        </Campo>

        <Campo etiqueta="Pie de foto" ayuda="Opcional. Se ve encima de la foto.">
          <Entrada
            value={campos.titulo}
            onChange={(e) => setCampos((c) => ({ ...c, titulo: e.target.value }))}
          />
        </Campo>

        <Campo etiqueta="Categoria">
          <Seleccion
            value={campos.categoria}
            onChange={(e) => setCampos((c) => ({ ...c, categoria: e.target.value }))}
          >
            {CATEGORIAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.etiqueta}
              </option>
            ))}
          </Seleccion>
        </Campo>

        {error && <Aviso tipo="error">{error}</Aviso>}

        <div className="galeria-admin__acciones">
          {cambiado && (
            <Boton variante="principal" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Boton>
          )}
          <button type="button" className="enlace enlace--peligro" onClick={borrar}>
            Borrar
          </button>
          <span className="apagado galeria-admin__medidas">
            {foto.ancho} × {foto.alto}
          </span>
        </div>
      </div>
    </li>
  );
}
