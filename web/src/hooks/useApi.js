import { useEffect, useState } from 'react';

/**
 * Ejecuta una llamada a la API y devuelve { datos, cargando, error }.
 *
 * `peticion` recibe { signal } para poder abortar cuando cambian las
 * dependencias o se desmonta el componente.
 */
export function useApi(peticion, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null });

  useEffect(() => {
    const controlador = new AbortController();
    let vigente = true;

    setEstado((previo) => ({ ...previo, cargando: true, error: null }));

    peticion({ signal: controlador.signal })
      .then((datos) => {
        if (vigente) setEstado({ datos, cargando: false, error: null });
      })
      .catch((error) => {
        if (error.name === 'AbortError' || !vigente) return;
        setEstado({ datos: null, cargando: false, error });
      });

    return () => {
      vigente = false;
      controlador.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  return estado;
}
