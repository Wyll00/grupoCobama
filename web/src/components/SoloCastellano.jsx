import { ui } from '../datos/idioma.js';
import { useIdioma } from '../hooks/useIdioma.js';

/**
 * El aviso de que esta pagina solo esta en castellano.
 *
 * El aviso legal y la politica de privacidad no se traducen a proposito. No
 * es pereza: son textos con efectos juridicos, y una traduccion aproximada de
 * una politica de privacidad no dice lo mismo que el original. Si las dos
 * versiones difieren, la mala no protege a nadie -ni al cliente ni al local-.
 *
 * Lo que si se traduce es el aviso de proteccion de datos del formulario de
 * reserva, que es donde se da el consentimiento: eso tiene que entenderlo
 * quien lo marca, y ahi callar seria peor.
 *
 * En castellano no se pinta nada: no hay nada que avisar.
 */
export default function SoloCastellano() {
  const [idioma] = useIdioma();
  const aviso = ui('legal.soloCastellano', idioma);
  if (idioma === 'es' || !aviso) return null;

  return (
    <p className="legal__idioma" lang={idioma}>
      {aviso}
    </p>
  );
}
