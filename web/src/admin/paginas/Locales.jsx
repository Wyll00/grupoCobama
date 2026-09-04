import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { adminApi } from '../api.js';
import { useDatos } from '../useDatos.js';
import { Aviso, Boton, Campo, Entrada, Interruptor, Seleccion } from '../componentes/Campos.jsx';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
// Lunes primero, como se lee una semana en Espana. El numero sigue siendo el
// del esquema -0 es domingo-, esto es solo el orden en que se pintan.
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

const NUM = '(-?[0-9]+(?:[.][0-9]+)?)';

/**
 * Saca las coordenadas de lo que sea que pegue alguien de Google Maps.
 *
 * Existe por un fallo real: las cuatro casas tenian el punto a un kilometro,
 * porque estaban puestos a ojo sobre el mapa. Copiar dos decimales a mano
 * desde una direccion de Google es justo donde se cuela ese error.
 *
 * EL ORDEN NO ES CASUAL. En una direccion de Maps hay hasta tres pares de
 * numeros y no dicen lo mismo:
 *
 *   !3d28.4901313!4d-16.3665752   el sitio. Este es el bueno.
 *   ?q=28.49,-16.36               un punto pedido a proposito. Tambien vale.
 *   @28.490136,-16.3691501,17z    el centro del mapa al compartir. Se mueve
 *                                 si mueves el mapa antes de copiar.
 *
 * En Como en Casa el sitio y la vista se llevan 250 metros. Por eso se busca
 * primero el sitio, y la vista es el ultimo recurso y con aviso.
 */
export function coordenadasDe(texto) {
  const t = String(texto ?? '').trim();
  if (!t) return null;

  const sitio = t.match(new RegExp('!3d' + NUM + '!4d' + NUM));
  if (sitio) return { lat: +sitio[1], lng: +sitio[2], fuente: 'sitio' };

  const parametro = t.match(new RegExp('[?&](?:q|query|destination|ll)=' + NUM + ',[ ]*' + NUM));
  if (parametro) return { lat: +parametro[1], lng: +parametro[2], fuente: 'parametro' };

  const vista = t.match(new RegExp('@' + NUM + ',' + NUM));
  if (vista) return { lat: +vista[1], lng: +vista[2], fuente: 'vista' };

  const sueltos = t.match(new RegExp('^' + NUM + '[,][ ]*' + NUM + '$'));
  if (sueltos) return { lat: +sueltos[1], lng: +sueltos[2], fuente: 'sueltos' };

  return null;
}

/** Metros entre dos puntos, para poder decir cuanto se mueve el sitio. */
export function metrosEntre(a, b) {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return null;
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

const esEnlaceCorto = (t) => String(t ?? '').includes('goo.gl');

export default function Locales() {
  const { esAdmin, localFijo } = useAuth();
  const [params, setParams] = useSearchParams();

  const locales = useDatos(() => adminApi.restaurantes(), []);
  const lista = locales.datos ?? [];
  const localId = esAdmin ? Number(params.get('local')) || lista[0]?.id : localFijo;

  const guardado = useDatos(
    () => (localId ? adminApi.local(localId) : Promise.resolve(null)),
    [localId]
  );

  const [form, setForm] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [pegado, setPegado] = useState('');
  const [estado, setEstado] = useState({ guardando: false, hecho: '', error: '' });

  // El formulario se rellena con lo que hay guardado, y se vuelve a rellenar
  // cada vez que el servidor devuelve la fila -o sea, tras guardar-. Asi lo
  // que se ve en pantalla es siempre lo que hay en la base, y no lo que el
  // formulario cree haber mandado.
  useEffect(() => {
    if (!guardado.datos) return;
    const d = guardado.datos;
    setForm({
      nombre: d.nombre ?? '',
      municipio: d.municipio ?? '',
      direccion: d.direccion ?? '',
      telefono: d.telefono ?? '',
      whatsapp: d.whatsapp ?? '',
      email: d.email ?? '',
      reclamo: d.reclamo ?? '',
      lat: d.lat ?? '',
      lng: d.lng ?? '',
      tiene_parking: Boolean(d.tiene_parking),
      url_reservas: d.url_reservas ?? '',
    });
    setHorarios(
      ORDEN_DIAS.map((dia) => {
        const suyo = (d.horarios ?? []).find((h) => h.dia_semana === dia);
        return {
          dia_semana: dia,
          cerrado: suyo?.cerrado ?? false,
          hora_apertura: suyo?.hora_apertura ?? '',
          hora_cierre: suyo?.hora_cierre ?? '',
        };
      })
    );
    setPegado('');
  }, [guardado.datos]);

  if (locales.error) return <Aviso tipo="error">{locales.error.message}</Aviso>;
  if (!form) return <p className="admin-cargando">Cargando el local...</p>;

  const campo = (k) => ({
    value: form[k],
    onChange: (e) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setEstado((s) => ({ ...s, hecho: '' }));
    },
  });

  const puntoGuardado = { lat: guardado.datos?.lat, lng: guardado.datos?.lng };
  const puntoForm =
    form.lat === '' || form.lng === '' ? null : { lat: Number(form.lat), lng: Number(form.lng) };
  const movimiento = metrosEntre(puntoGuardado, puntoForm);
  const leido = coordenadasDe(pegado);

  const aplicarPegado = () => {
    if (!leido) return;
    setForm((f) => ({ ...f, lat: String(leido.lat), lng: String(leido.lng) }));
    setEstado((s) => ({ ...s, hecho: '' }));
  };

  const cambiarDia = (dia, cambio) =>
    setHorarios((hs) => hs.map((h) => (h.dia_semana === dia ? { ...h, ...cambio } : h)));

  const guardar = async () => {
    setEstado({ guardando: true, hecho: '', error: '' });
    const hechos = [];
    try {
      await adminApi.guardarLocal(localId, {
        ...form,
        lat: form.lat === '' ? null : Number(form.lat),
        lng: form.lng === '' ? null : Number(form.lng),
      });
      hechos.push('los datos');

      await adminApi.guardarHorarios(
        localId,
        horarios.map((h) => ({
          dia_semana: h.dia_semana,
          cerrado: h.cerrado,
          hora_apertura: h.cerrado ? null : h.hora_apertura,
          hora_cierre: h.cerrado ? null : h.hora_cierre,
        }))
      );
      hechos.push('los horarios');

      guardado.recargar();
      setEstado({ guardando: false, hecho: 'Guardado.', error: '' });
    } catch (err) {
      // Se dice QUE quedo guardado antes del fallo. "Error al guardar" a
      // secas deja sin saber si hay que repetirlo todo o solo la mitad.
      const yaVa = hechos.length ? ` ${hechos.join(' y ')} si se guardaron.` : '';
      setEstado({ guardando: false, hecho: '', error: `${err.message}.${yaVa}` });
      guardado.recargar();
    }
  };

  return (
    <>
      <header className="pagina__cabecera">
        <div>
          <h1>Datos del local</h1>
          <p className="apagado">
            Lo que sale en su ficha: donde esta, como se llega, a que hora abre y por
            donde se le llama.
          </p>
        </div>

        {esAdmin && lista.length > 1 && (
          <div className="pagina__acciones">
            <Seleccion
              value={localId ?? ''}
              onChange={(e) => setParams({ local: e.target.value })}
              aria-label="Local"
            >
              {lista.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </Seleccion>
          </div>
        )}
      </header>

      <Aviso tipo="error">{estado.error}</Aviso>
      <Aviso tipo="error">{guardado.error?.message}</Aviso>

      <section className="bloque-ajustes">
        <h2>Como se presenta</h2>
        <div className="rejilla-campos">
          <Campo etiqueta="Nombre">
            <Entrada {...campo('nombre')} maxLength={120} />
          </Campo>
          <Campo
            etiqueta="Frase corta"
            ayuda="La linea que acompana al nombre en la portada y en la cabecera."
          >
            <Entrada {...campo('reclamo')} maxLength={180} />
          </Campo>
        </div>
        {/*
          El slug no se edita, y conviene que se vea por que o alguien lo
          pedira. Va en pequeno y no como un campo desactivado: un campo gris
          invita a preguntar como se activa.
        */}
        <p className="campo__ayuda">
          La direccion de la ficha es <code>/{guardado.datos?.slug}</code> y no se cambia
          desde aqui: es la que llevan impresa los codigos QR de las mesas.
        </p>
      </section>

      <section className="bloque-ajustes">
        <h2>Donde esta</h2>
        <div className="rejilla-campos">
          <Campo etiqueta="Direccion">
            <Entrada {...campo('direccion')} maxLength={200} />
          </Campo>
          <Campo etiqueta="Municipio">
            <Entrada {...campo('municipio')} maxLength={80} />
          </Campo>
        </div>

        <Interruptor
          etiqueta="Tiene parking propio"
          checked={form.tiene_parking}
          onChange={(e) => setForm((f) => ({ ...f, tiene_parking: e.target.checked }))}
        />

        <h3 className="bloque-ajustes__sub">El punto del mapa</h3>
        <p className="campo__ayuda">
          Es lo que usa el boton <strong>Como llegar</strong> de la ficha. Pega la
          direccion de la ficha del local en Google Maps y se rellena sola.
        </p>

        <div className="pegar-mapa">
          <Entrada
            value={pegado}
            onChange={(e) => setPegado(e.target.value)}
            placeholder="https://www.google.com/maps/place/..."
            aria-label="Direccion de Google Maps"
          />
          <Boton onClick={aplicarPegado} disabled={!leido}>
            Leer coordenadas
          </Boton>
        </div>

        {pegado && !leido && (
          <p className="campo__error">
            {esEnlaceCorto(pegado)
              ? 'Ese es un enlace corto y no lleva las coordenadas dentro. Abrelo en el navegador y copia de la barra la direccion larga.'
              : 'No encuentro coordenadas ahi dentro.'}
          </p>
        )}

        {leido?.fuente === 'vista' && (
          <p className="campo__error">
            Eso es el centro del mapa, no el sitio: puede quedarse a un par de cientos de
            metros. Abre la ficha del local en Maps y copia esa direccion.
          </p>
        )}

        <div className="rejilla-campos">
          <Campo etiqueta="Latitud">
            <Entrada {...campo('lat')} inputMode="decimal" placeholder="28.4901313" />
          </Campo>
          <Campo etiqueta="Longitud">
            <Entrada {...campo('lng')} inputMode="decimal" placeholder="-16.3665752" />
          </Campo>
        </div>

        {/* Cuanto se mueve respecto a lo guardado. Con este numero a la vista,
            un punto puesto a ojo se nota el primer dia. */}
        {movimiento > 0 && (
          <p className="campo__ayuda">
            Mueve el punto <strong>{movimiento.toLocaleString('es-ES')} m</strong> respecto
            a lo que hay guardado.
          </p>
        )}
        {puntoForm && (
          <p className="campo__ayuda">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${puntoForm.lat},${puntoForm.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver ese punto en el mapa
            </a>
            {' antes de guardar.'}
          </p>
        )}
      </section>

      <section className="bloque-ajustes">
        <h2>Horarios</h2>
        <p className="campo__ayuda">
          Un cierre que no sea posterior a la apertura se entiende de madrugada: de 12:30
          a 00:00 es hasta medianoche, no cerrado todo el dia.
        </p>

        <table className="tabla tabla--horarios">
          <thead>
            <tr>
              <th>Dia</th>
              <th>Abre</th>
              <th>Cierra</th>
              <th className="tabla__centro">Cerrado</th>
            </tr>
          </thead>
          <tbody>
            {horarios.map((h) => (
              <tr key={h.dia_semana} className={h.cerrado ? 'tabla__fila--apagada' : undefined}>
                <td>{DIAS[h.dia_semana]}</td>
                <td>
                  <Entrada
                    type="time"
                    value={h.hora_apertura}
                    disabled={h.cerrado}
                    onChange={(e) => cambiarDia(h.dia_semana, { hora_apertura: e.target.value })}
                    aria-label={`Hora de apertura del ${DIAS[h.dia_semana]}`}
                  />
                </td>
                <td>
                  <Entrada
                    type="time"
                    value={h.hora_cierre}
                    disabled={h.cerrado}
                    onChange={(e) => cambiarDia(h.dia_semana, { hora_cierre: e.target.value })}
                    aria-label={`Hora de cierre del ${DIAS[h.dia_semana]}`}
                  />
                </td>
                <td className="tabla__centro">
                  <input
                    type="checkbox"
                    checked={h.cerrado}
                    onChange={(e) => cambiarDia(h.dia_semana, { cerrado: e.target.checked })}
                    aria-label={`${DIAS[h.dia_semana]} cerrado`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bloque-ajustes">
        <h2>Contacto y reservas</h2>
        <div className="rejilla-campos">
          <Campo etiqueta="Telefono">
            <Entrada {...campo('telefono')} maxLength={20} />
          </Campo>
          <Campo etiqueta="WhatsApp" ayuda="Con prefijo, como +34822680304.">
            <Entrada {...campo('whatsapp')} maxLength={20} />
          </Campo>
          <Campo etiqueta="Correo">
            <Entrada {...campo('email')} type="email" maxLength={120} />
          </Campo>
          <Campo
            etiqueta="Reservas por fuera"
            ayuda="Si las reservas van a otra web. Vacio para usar el formulario de la casa."
          >
            <Entrada {...campo('url_reservas')} placeholder="https://..." maxLength={500} />
          </Campo>
        </div>
      </section>

      <div className="acciones-guardar">
        <Boton variante="principal" onClick={guardar} disabled={estado.guardando}>
          {estado.guardando ? 'Guardando...' : 'Guardar cambios'}
        </Boton>
        {estado.hecho && <span className="acciones-guardar__hecho">{estado.hecho}</span>}
      </div>
    </>
  );
}
