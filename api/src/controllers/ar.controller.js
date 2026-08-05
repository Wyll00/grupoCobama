import { obtenerPlatoAr, estadoAr, glbDelPlato } from '../services/ar.service.js';

/**
 * Endpoint publico: lo llama la carta desde el movil del cliente, sin sesion.
 * Devuelve las rutas de los modelos, no los ficheros: el visor los pide luego
 * directamente y asi se sirven como estaticos cacheables.
 */
export async function getAr(req, res) {
  const plato = await obtenerPlatoAr(Number(req.params.id));
  const estado = estadoAr(plato);

  if (!estado.disponible) {
    return res.json({ datos: { ...estado, plato: { id: plato.id, nombre: plato.nombre } } });
  }

  const { ruta } = await glbDelPlato(plato.id);

  res.json({
    datos: {
      ...estado,
      plato: { id: plato.id, nombre: plato.nombre },
      glb: ruta,
      // iOS necesita USDZ para AR Quick Look. Si no lo hay, el visor 3D sigue
      // funcionando; lo que no sale es el boton de camara.
      usdz: plato.modelo_usdz,
    },
  });
}
