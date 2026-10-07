import { Link } from 'react-router-dom';
import { ui } from '../datos/idioma.js';
import { useIdioma } from '../hooks/useIdioma.js';
import { useSocio } from '../hooks/useSocio.js';

/**
 * El acceso a la tarjeta de socio, en la cabecera.
 *
 * Siempre apunta a `/socio` y no al perfil directamente, aunque el codigo este
 * recordado: de decidirlo aqui habria dos sitios que saben a donde va un socio
 * identificado -este boton y la propia puerta- y el dia que cambie uno, el
 * otro se queda viejo. `/socio` ya sabe redirigir solo; ver `SocioEntrar.jsx`.
 *
 * Lo que si cambia segun quien mire es el ROTULO. "Mi tarjeta" a quien no es
 * socio le promete algo que no tiene; "Tarjeta de socio" a quien ya la tiene
 * suena a folleto. Como el boton es un icono y el rotulo solo lo oye un lector
 * de pantalla o lo ve quien deja el raton encima, no cuesta nada acertar.
 *
 * El icono es el monigote de siempre -cabeza y hombros- dibujado aqui mismo.
 * No se trae una libreria de iconos para un glifo: el resto de la web -el
 * logo, el plato del modo oscuro- tambien va en SVG a mano.
 */
export default function BotonPerfil() {
  const [idioma] = useIdioma();
  const { codigo } = useSocio();

  const rotulo = ui(codigo ? 'nav.miTarjeta' : 'nav.tarjetaSocio', idioma);

  return (
    <Link to="/socio" className="mando-perfil" aria-label={rotulo} title={rotulo}>
      <svg viewBox="0 0 44 44" width="26" height="26" aria-hidden="true" focusable="false">
        {/* La cabeza. */}
        <circle cx="22" cy="17" r="6.2" className="mando-perfil__trazo" />

        {/* Los hombros: media capsula abierta por abajo. Cortada en y=34 y no
            cerrada, que un ovalo entero debajo de la cabeza parece un cuerpo
            flotando y no un busto. */}
        <path d="M10.5 34.5a11.5 10 0 0 1 23 0" className="mando-perfil__trazo" />
      </svg>
    </Link>
  );
}
