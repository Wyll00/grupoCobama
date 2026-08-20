import { useEffect, useState } from 'react';
import { adminApi, ErrorApi } from '../api.js';
import { useAuth } from '../auth.jsx';
import { puedeEditarPlato, motivoNoEditable } from '../permisos.js';
import { useDatos } from '../useDatos.js';
import Modal from './Modal.jsx';
import RecorteImagen from './RecorteImagen.jsx';
import PreciosPorLocal from './PreciosPorLocal.jsx';
import RevisionAlergenos from './RevisionAlergenos.jsx';
import {
  Aviso,
  AreaTexto,
  Boton,
  Campo,
  Entrada,
  Interruptor,
  Seleccion,
} from './Campos.jsx';

/**
 * Ficha de un plato: datos del catalogo del grupo, imagen y precio por local.
 *
 * Se abre desde dos sitios, y por eso vive aqui y no dentro de una pagina:
 * desde Catalogo, para dar de alta y mantener el plato; y desde la carta de un
 * local, para corregir sobre la marcha lo que se vea mal sin salir de la carta.
 *
 * Los campos del catalogo se bloquean segun quien sea el plato: un encargado
 * edita los que solo sirve su casa, pero no los que comparten varias, porque
 * el nombre es el mismo para todas. El precio por local no depende de eso: lo
 * gobierna PreciosPorLocal segun el ambito de cada usuario.
 */
const VACIO = {
  categoria_id: '',
  nombre: '',
  nombre_en: '',
  descripcion: '',
  descripcion_en: '',
  es_vegetariano: false,
  es_vegano: false,
  activo: true,
  alergenos: [],
};

export default function EditorPlato({ id, onCerrar, onGuardado }) {
  const { esAdmin, localFijo } = useAuth();
  // Las categorias se piden aqui y no llegan por prop: se abre desde dos
  // pantallas y pasarlas de la mano era una fuente de errores, aparte de
  // acoplar cada pantalla a un dato que no es suyo.
  const listaCategorias = useDatos(() => adminApi.categorias(), []);
  const esNuevo = id === null;
  const alergenos = useDatos(() => adminApi.alergenos(), []);
  const existente = useDatos(
    () => (esNuevo ? Promise.resolve(null) : adminApi.plato(id)),
    [id]
  );

  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [ficheroImagen, setFicheroImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const plato = existente.datos;

  // Quien puede tocar el plato se decide con el propio plato, no con el rol a
  // secas: un encargado edita los suyos, pero no los que comparten varias
  // casas. La API aplica la misma regla; esto solo evita ensenar botones que
  // van a responder 403.
  const soloLectura = esNuevo
    ? !esAdmin
    : !puedeEditarPlato(plato, { esAdmin, localFijo });
  const motivo = plato ? motivoNoEditable(plato, { esAdmin, localFijo }) : null;

  useEffect(() => {
    if (!plato) return;
    setForm({
      categoria_id: plato.categoria_id,
      nombre: plato.nombre,
      nombre_en: plato.nombre_en ?? '',
      descripcion: plato.descripcion ?? '',
      descripcion_en: plato.descripcion_en ?? '',
      es_vegetariano: plato.es_vegetariano,
      es_vegano: plato.es_vegano,
      activo: plato.activo,
      alergenos: plato.alergenos.map((a) => a.id),
    });
  }, [plato]);

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const alternarAlergeno = (idAlergeno) =>
    setForm((f) => ({
      ...f,
      alergenos: f.alergenos.includes(idAlergeno)
        ? f.alergenos.filter((a) => a !== idAlergeno)
        : [...f.alergenos, idAlergeno],
    }));

  const guardar = async () => {
    setEnviando(true);
    setError(null);
    try {
      // Vegano implica vegetariano: se manda coherente para que no queden
      // platos marcados como veganos pero no vegetarianos.
      const datos = { ...form, es_vegetariano: form.es_vegetariano || form.es_vegano };
      if (esNuevo) await adminApi.crearPlato(datos);
      else await adminApi.editarPlato(id, datos);
      onGuardado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  const retirar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await adminApi.desactivarPlato(id);
      onGuardado();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
      setEnviando(false);
    }
  };

  const subirRecorte = async (recorte) => {
    setSubiendo(true);
    setError(null);
    try {
      const datos = new FormData();
      datos.append('imagen', ficheroImagen);
      if (recorte) {
        datos.append('x', recorte.x);
        datos.append('y', recorte.y);
        datos.append('ancho', recorte.ancho);
        datos.append('alto', recorte.alto);
      }
      await adminApi.subirImagen(id, datos);
      setFicheroImagen(null);
      existente.recargar();
    } catch (err) {
      setError(err instanceof ErrorApi ? err.detalle || err.message : 'Error inesperado');
    } finally {
      setSubiendo(false);
    }
  };

  if (ficheroImagen) {
    return (
      <Modal titulo="Encuadrar la imagen" onCerrar={() => setFicheroImagen(null)} ancho="720px">
        <Aviso tipo="error">{error}</Aviso>
        <RecorteImagen
          fichero={ficheroImagen}
          enviando={subiendo}
          onCancelar={() => setFicheroImagen(null)}
          onConfirmar={subirRecorte}
        />
      </Modal>
    );
  }

  return (
    <Modal
      titulo={esNuevo ? 'Nuevo plato' : plato?.nombre ?? 'Cargando...'}
      onCerrar={onCerrar}
      ancho="760px"
      pie={
        soloLectura ? (
          <Boton onClick={onCerrar}>Cerrar</Boton>
        ) : (
          <>
            {!esNuevo && form.activo && (
              <Boton onClick={retirar} disabled={enviando}>
                Retirar del catalogo
              </Boton>
            )}
            <Boton onClick={onCerrar} disabled={enviando}>
              Cancelar
            </Boton>
            <Boton variante="principal" onClick={guardar} disabled={enviando}>
              {enviando ? 'Guardando...' : 'Guardar'}
            </Boton>
          </>
        )
      }
    >
      <Aviso tipo="error">{error}</Aviso>
      {motivo && <Aviso>Solo lectura. {motivo}</Aviso>}
      {existente.cargando && <p className="admin-cargando">Cargando...</p>}

      <fieldset disabled={soloLectura} className="formulario">
        <div className="formulario__fila">
          <Campo etiqueta="Nombre">
            <Entrada value={form.nombre} onChange={cambiar('nombre')} />
          </Campo>
          <Campo etiqueta="Nombre en ingles" ayuda="Se puede rellenar mas adelante">
            <Entrada value={form.nombre_en} onChange={cambiar('nombre_en')} />
          </Campo>
        </div>

        <Campo etiqueta="Categoria">
          <Seleccion value={form.categoria_id} onChange={cambiar('categoria_id')}>
            <option value="">Elige una categoria</option>
            {(listaCategorias.datos ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Seleccion>
        </Campo>

        <Campo etiqueta="Descripcion">
          <AreaTexto value={form.descripcion} onChange={cambiar('descripcion')} />
        </Campo>

        <Campo etiqueta="Descripcion en ingles">
          <AreaTexto value={form.descripcion_en} onChange={cambiar('descripcion_en')} />
        </Campo>

        <div className="formulario__interruptores">
          <Interruptor
            etiqueta="Vegetariano"
            checked={form.es_vegetariano || form.es_vegano}
            disabled={form.es_vegano}
            onChange={cambiar('es_vegetariano')}
          />
          <Interruptor etiqueta="Vegano" checked={form.es_vegano} onChange={cambiar('es_vegano')} />
          <Interruptor etiqueta="Activo en el catalogo" checked={form.activo} onChange={cambiar('activo')} />
        </div>

        <Campo
          etiqueta="Alergenos"
          ayuda="Informacion obligatoria por el Reglamento (UE) 1169/2011. Confirmala con cocina."
        >
          <div className="rejilla-alergenos">
            {(alergenos.datos ?? []).map((a) => (
              <Interruptor
                key={a.id}
                etiqueta={a.nombre}
                checked={form.alergenos.includes(a.id)}
                onChange={() => alternarAlergeno(a.id)}
              />
            ))}
          </div>

          {!esNuevo && (
            <RevisionAlergenos
              plato={plato}
              soloLectura={soloLectura}
              onConfirmado={() => existente.recargar()}
            />
          )}
        </Campo>
      </fieldset>

      {!esNuevo && (
        <>
          <h3 className="subtitulo">Imagen</h3>
          <div className="imagen-plato">
            {plato?.imagen ? (
              <img src={plato.imagen} alt={plato.nombre} />
            ) : (
              <div className="imagen-plato__vacia">Sin imagen</div>
            )}

            {!soloLectura && (
              <div className="imagen-plato__acciones">
                <label className="btn btn--secundario">
                  {plato?.imagen ? 'Cambiar imagen' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFicheroImagen(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {plato?.imagen && (
                  <Boton
                    onClick={async () => {
                      await adminApi.quitarImagen(id);
                      existente.recargar();
                    }}
                  >
                    Quitar
                  </Boton>
                )}
              </div>
            )}
          </div>

          <h3 className="subtitulo">Precio por local</h3>
          <p className="apagado nota-seccion">
            El precio no es del plato, es de cada carta: el mismo plato puede costar
            distinto en cada casa. Cambiarlo queda registrado en el historico.
          </p>
          {plato && (
            <PreciosPorLocal
              platoId={plato.id}
              platoActivo={plato.activo}
              enCartas={plato.en_cartas}
              onCambio={async () => existente.recargar()}
            />
          )}
        </>
      )}
    </Modal>
  );
}
