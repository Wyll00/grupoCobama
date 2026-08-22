import * as galeria from '../services/galeria.service.js';
import { procesarImagenGaleria, borrarImagenGaleria } from '../services/imagenes.service.js';
import { subirFotoSchema } from '../esquemas/galeria.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Los campos del formulario llegan como texto dentro del multipart, no como
 * JSON, asi que no pasan por validarCuerpo y hay que validarlos aqui.
 */
function leerCampos(body) {
  const parseado = subirFotoSchema.safeParse(body ?? {});
  if (!parseado.success) {
    throw ApiError.peticionInvalida(
      'Los datos de la foto no son validos',
      parseado.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }))
    );
  }
  return parseado.data;
}

async function subir(req, res, restauranteId) {
  if (!req.file) throw ApiError.peticionInvalida('No se ha recibido ninguna imagen');

  const campos = leerCampos(req.body);
  const procesada = await procesarImagenGaleria(req.file.buffer);

  try {
    const foto = await galeria.crear({
      restauranteId,
      categoria: campos.categoria,
      imagen: procesada.imagen,
      thumb: procesada.thumb,
      ancho: procesada.ancho,
      alto: procesada.alto,
      titulo: campos.titulo,
      alt: campos.alt,
    });
    res.status(201).json({ datos: foto });
  } catch (e) {
    // Si la fila no llega a escribirse, los dos ficheros ya estan en disco y
    // nadie volveria a saber de ellos. Se limpian antes de propagar el error.
    await borrarImagenGaleria(procesada.imagen, procesada.thumb);
    throw e;
  }
}

export async function getGaleriaLocal(req, res) {
  res.json({ datos: await galeria.listarAdmin({ ambito: req.restauranteId }) });
}

export async function postFotoLocal(req, res) {
  await subir(req, res, req.restauranteId);
}

export async function getGaleriaGrupo(req, res) {
  res.json({ datos: await galeria.listarAdmin({ ambito: 'grupo' }) });
}

export async function postFotoGrupo(req, res) {
  await subir(req, res, null);
}

export async function patchFoto(req, res) {
  res.json({ datos: await galeria.actualizar(Number(req.params.id), req.body) });
}

export async function deleteFoto(req, res) {
  res.json({ datos: await galeria.borrar(Number(req.params.id)) });
}

export async function postOrdenLocal(req, res) {
  res.json({ datos: await galeria.reordenar(req.body.ids, { restauranteId: req.restauranteId }) });
}

export async function postOrdenGrupo(req, res) {
  res.json({ datos: await galeria.reordenar(req.body.ids, { restauranteId: null }) });
}
