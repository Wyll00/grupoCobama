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

export const enlaceMapa = ({ nombre, direccion, lat, lng }) =>
  lat && lng
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nombre} ${direccion}`)}`;
