import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSocio } from '../hooks/useSocio.js';

/**
 * La puerta de la zona de socio.
 *
 * Tiene que responder a DOS personas distintas, y antes solo respondia a una:
 *
 *   - Quien ya tiene tarjeta y viene a verla. Escribe su codigo.
 *   - Quien no tiene y quiere una. Antes esta persona se encontraba un campo
 *     pidiendole un codigo que no existe, sin mas salida que irse. Que es
 *     justo al reves de lo que interesa: el que llega aqui sin tarjeta es
 *     exactamente al que hay que hacerle una.
 *
 * Por eso lo primero y mas grande es hacerse socio, y lo de abajo es entrar.
 * El que ya tiene tarjeta casi nunca pasa por aqui -entra por el QR o porque
 * el navegador le recuerda-, asi que esta pantalla la ve sobre todo gente
 * nueva.
 *
 * Y si el navegador ya recuerda un codigo, no se pregunta nada: se entra.
 */
export default function SocioEntrar() {
  const { codigo: recordado } = useSocio();
  const [codigo, setCodigo] = useState('');
  const navegar = useNavigate();

  // Ya identificado: directo a lo suyo, sin preguntar.
  if (recordado) return <Navigate to={`/socio/${recordado}`} replace />;

  const enviar = (e) => {
    e.preventDefault();
    const limpio = codigo.trim().toUpperCase();
    if (limpio) navegar(`/socio/${limpio}`);
  };

  return (
    <section className="seccion">
      <div className="contenedor socio-entrar">
        <h1>Tarjeta de socio</h1>
        <p className="apagado">
          Una tarjeta para las cuatro casas. Cada vez que vengas te apuntamos la
          visita, y a las cinco hay premio.
        </p>

        <Link className="boton boton--principal socio-entrar__alta" to="/socio/alta">
          Hazme la tarjeta
        </Link>

        <p className="apagado socio-entrar__gratis">
          Es gratis y se hace en un minuto. No hay que inventarse ninguna contraseña.
        </p>

        {/* La raya separa dos cosas que no son alternativas de la misma
            accion: arriba se crea algo, abajo se recupera algo que ya existe.
            Sin ella, los dos botones se leen como "elige uno de los dos". */}
        <hr className="socio-entrar__raya" />

        <h2 className="socio-entrar__ya">¿Ya tienes tarjeta?</h2>
        <form onSubmit={enviar}>
          <label className="reserva__campo">
            <span>Escribe su código</span>
            <input
              className="buscador socio-entrar__codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej. TDUXN435"
              autoComplete="off"
              maxLength={10}
              required
            />
          </label>

          <button className="boton" type="submit" disabled={!codigo.trim()}>
            Entrar
          </button>
        </form>

        <p className="apagado socio-entrar__nota">
          Lo tienes en la propia tarjeta, debajo del nombre. Si la has perdido, te la
          buscamos en cualquiera de las cuatro casas.
        </p>
      </div>
    </section>
  );
}
