import { useCallback, useEffect, useState } from 'react';

/**
 * Carga datos del panel con recarga manual.
 *
 * A diferencia del useApi publico, aqui hace falta `recargar`: casi todas las
 * pantallas modifican algo y necesitan volver a pedir la lista.
 */
export function useDatos(peticion, dependencias = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null });
  const [contador, setContador] = useState(0);

  const recargar = useCallback(() => setContador((n) => n + 1), []);

  useEffect(() => {
    let vigente = true;
    setEstado((previo) => ({ ...previo, cargando: true, error: null }));

    peticion()
      .then((datos) => vigente && setEstado({ datos, cargando: false, error: null }))
      .catch((error) => vigente && setEstado({ datos: null, cargando: false, error }));

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, contador]);

  return { ...estado, recargar };
}
