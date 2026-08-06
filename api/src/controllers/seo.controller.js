import { sitemap, robots } from '../services/seo.service.js';

export async function getSitemap(req, res) {
  res.type('application/xml').send(await sitemap());
}

export async function getRobots(req, res) {
  res.type('text/plain').send(robots());
}
