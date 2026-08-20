import { pool } from '../config/db.js';
import { procesarPortada, borrarPortada } from '../services/imagenes.service.js';
import { recorteSchema } from '../esquemas/catalogo.js';
import { ApiError } from '../utils/ApiError.js';

async function obtener(id) {
  const [filas] = await pool.execute(
    'SELECT id, slug, nombre, imagen_portada FROM restaurantes WHERE id = ? LIMIT 1',
    [id]
  );
  if (!filas[0]) throw ApiError.noEncontrado('Ese local no existe');
  return filas[0];
}

export async function postPortada(req, res) {
  if (!req.file) throw ApiError.peticionInvalida('No se ha recibido ninguna imagen');

  const anterior = await obtener(req.restauranteId);

  // El recorte llega como campos de texto del multipart, no como JSON.
  let recorte;
  if (req.body?.x !== undefined) {
    const parseado = recorteSchema.safeParse(req.body);
    if (!parseado.success) {
      throw ApiError.peticionInvalida(
        'Los datos del recorte no son validos',
        parseado.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }))
      );
    }
    recorte = parseado.data;
  }

  const { portada } = await procesarPortada(req.restauranteId, req.file.buffer, recorte);

  await pool.execute('UPDATE restaurantes SET imagen_portada = ? WHERE id = ?', [
    portada,
    req.restauranteId,
  ]);

  // Solo despues de que la nueva este guardada en base de datos.
  await borrarPortada(anterior.imagen_portada);

  res.json({ datos: await obtener(req.restauranteId) });
}

export async function deletePortada(req, res) {
  const anterior = await obtener(req.restauranteId);
  await pool.execute('UPDATE restaurantes SET imagen_portada = NULL WHERE id = ?', [
    req.restauranteId,
  ]);
  await borrarPortada(anterior.imagen_portada);
  res.json({ datos: await obtener(req.restauranteId) });
}
