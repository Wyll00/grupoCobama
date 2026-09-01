import { useCallback, useEffect, useState } from 'react';
import { idiomaGuardado, guardarIdioma } from '../datos/idioma.js';

/**
 * El idioma elegido, compartido por toda la pagina.
 *
 * Un solo valor para toda la aplicacion, con una lista de suscriptores en vez
 * de un contexto de React. El motivo es que `datos/idioma.js` tambien lo
 * necesita y no es un componente: con un contexto habria dos sitios donde vive
 * el mismo dato y algun dia dirian cosas distintas.
 *
 * Tambien pone `lang` en el <html>. No es cosmetico: un lector de pantalla
 * decide con eso como pronunciar, y "Hühnersuppe" leido con voz castellana no
 * lo entiende nadie. Y el navegador lo usa para ofrecer traducir la pagina.
 */

let actual = idiomaGuardado();
const suscriptores = new Set();

function aplicarAlDocumento(codigo) {
  document.documentElement.lang = codigo;
}

aplicarAlDocumento(actual);

export function cambiarIdioma(codigo) {
  if (codigo === actual) return;
  actual = codigo;
  guardarIdioma(codigo);
  aplicarAlDocumento(codigo);
  for (const avisar of suscriptores) avisar(codigo);
}

export function useIdioma() {
  const [idioma, setIdioma] = useState(actual);

  useEffect(() => {
    // Puede haber cambiado entre el primer pintado y este efecto.
    setIdioma(actual);
    suscriptores.add(setIdioma);
    return () => suscriptores.delete(setIdioma);
  }, []);

  const cambiar = useCallback((codigo) => cambiarIdioma(codigo), []);

  return [idioma, cambiar];
}
