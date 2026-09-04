import * as platos from '../services/platos.service.js';
import { procesarImagenPlato, borrarImagenes } from '../services/imagenes.service.js';
import { recorteSchema } from '../esquemas/catalogo.js';
import { ApiError } from '../utils/ApiError.js';

export async function getPlatos(req, res) {
  // El local sale de la sesion y nunca de la peticion, igual que en el
  // resumen: si viniera en la consulta, un encargado podria pedir el catalogo
  // pendiente de otra casa cambiando un numero en la barra de direcciones.
  const alcance =
    req.usuario.rol === 'admin_grupo' ? {} : { restauranteId: req.usuario.restaurante_id };

  res.json(await platos.listar(req.consulta, alcance));
}

export async function getPlato(req, res) {
  res.json({ datos: await platos.obtener(Number(req.params.id)) });
}

export async function postPlato(req, res) {
  res.status(201).json({ datos: await platos.crear(req.body) });
}

export async function patchPlato(req, res) {
  res.json({ datos: await platos.actualizar(Number(req.params.id), req.body) });
}

export async function postConfirmarAlergenos(req, res) {
  const datos = await platos.confirmarAlergenos(Number(req.params.id), req.usuario.id);
  res.json({ datos });
}

export async function deletePlato(req, res) {
  const id = Number(req.params.id);
  const resultado = await platos.desactivar(id);
  res.json({ datos: { ...(await platos.obtener(id)), ...resultado } });
}

export async function postImagen(req, res) {
  if (!req.file) throw ApiError.peticionInvalida('No se ha recibido ninguna imagen');

  const id = Number(req.params.id);
  const anterior = await platos.obtener(id);

  // El recorte llega como campos de texto del multipart, no como JSON.
  let recorte;
  if (req.body?.x !== undefined) {
    const parseado = recorteSchema.safeParse(req.body);
    if (!parseado.success) {
      throw ApiError.peticionInvalida(
        'Los datos del recorte no son validos',
        parseado.error.issues.map((i) => ({
          campo: i.path.join('.'),
          mensaje: i.message,
        }))
      );
    }
    recorte = parseado.data;
  }

  const { imagen, thumb } = await procesarImagenPlato(id, req.file.buffer, recorte);
  const actualizado = await platos.guardarImagen(id, { imagen, thumb });

  // Solo despues de que la nueva imagen este guardada en base de datos.
  await borrarImagenes(anterior.imagen, anterior.imagen_thumb);

  res.json({ datos: actualizado });
}

export async function deleteImagen(req, res) {
  const id = Number(req.params.id);
  const anterior = await platos.obtener(id);
  const actualizado = await platos.guardarImagen(id, { imagen: null, thumb: null });
  await borrarImagenes(anterior.imagen, anterior.imagen_thumb);
  res.json({ datos: actualizado });
}
