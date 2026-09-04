/**
 * Datos de contacto comunes al grupo.
 *
 * Los datos por local (direccion, telefono, horario) vienen de la API: son
 * los que cambian. Esto es solo lo que comparte el grupo entero.
 */
export const GRUPO = {
  nombre: 'Grupo Cobama',
  email: 'info@grupocobama.es',
  whatsapp: '+34822680304',
  whatsappDigitos: '34822680304',
  sede: 'Guamasa, Santa Cruz de Tenerife',
  instagram: 'https://www.instagram.com/grupocobama',
  tiktok: 'https://www.tiktok.com/@grupocobama',
};

export const enlaceWhatsApp = (mensaje) =>
  `https://wa.me/${GRUPO.whatsappDigitos}?text=${encodeURIComponent(mensaje)}`;

export const enlaceTelefono = (telefono) => `tel:${telefono.replace(/\s/g, '')}`;

/**
 * A donde lleva el boton "Como llegar".
 *
 * `dir` y no `search`: con search se abre la ficha del sitio con un pin y hay
 * que pulsar otra vez para que te lleve. Con dir, Maps abre la ruta desde
 * donde estas, que es lo que promete el boton; en el movil, la app en modo
 * navegacion. Quien solo queria ver donde cae lo tiene igual de facil, porque
 * la ruta ensena el destino en el mapa.
 *
 * Con coordenadas cuando las hay, que son exactas y no dependen de que Google
 * entienda el nombre. El nombre y la direccion quedan de respaldo: buscar
 * "Como en Casa Guamasa" acierta casi siempre. Casi.
 */
export const enlaceMapa = ({ nombre, direccion, lat, lng }) =>
  lat && lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${nombre} ${direccion}`)}`;
