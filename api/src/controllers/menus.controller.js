import { menusDeCelebracion } from '../services/menus.service.js';

export async function getMenusCelebracion(req, res) {
  res.json({ datos: await menusDeCelebracion(req.params.slug) });
}
