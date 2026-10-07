import QRCode from 'qrcode';
import * as socios from '../services/socios.service.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Tarjeta de socio.
 *
 * La parte publica es casi toda de LECTURA y va sin sesion: el QR de la
 * tarjeta tiene que abrirse en el movil de cualquiera sin instalar ni entrar
 * en nada. Apuntar visitas y entregar premios va por el panel, con sesion.
 *
 * La unica excepcion es darse de alta uno mismo, que escribe. Se puede dejar
 * abierta porque una tarjeta recien hecha no vale nada: nace con cero visitas
 * y las visitas solo las apunta el personal desde el panel. Lo peor que puede
 * hacer alguien con esto es ensuciar la tabla, y para eso esta el limite por
 * IP de `routes/index.js`.
 */

const urlTarjeta = (codigo) => `${env.webBaseUrl.replace(/\/$/, '')}/socio/${codigo}`;

// ----------------------------------------------------------------- publico

/**
 * La tarjeta por su codigo.
 *
 * Devuelve el nombre y las visitas, no el telefono ni el email: el enlace lo
 * puede abrir cualquiera que vea el QR encima de una mesa, y lo que hace falta
 * para reconocer la tarjeta es el nombre, no los datos de contacto.
 */
export async function getTarjeta(req, res) {
  const tarjeta = await socios.porCodigo(req.params.codigo);
  const { telefono, email, ...publico } = tarjeta;

  /*
    El QR va en la propia tarjeta.

    No es un secreto: lleva la direccion de ESTA pagina, que quien la esta
    mirando ya tiene. Servirlo aqui evita que el cliente tenga que entrar en
    ningun sitio para ensenarlo, que es justo lo que tiene que pasar en la
    puerta de un restaurante con el movil en la mano.

    En SVG y no en PNG: se ensena en pantallas de todos los tamanos y en papel
    si alguien la imprime, y un SVG no se pixela en ninguno.
  */
  const qr = await QRCode.toString(urlTarjeta(tarjeta.codigo), {
    errorCorrectionLevel: 'M',
    margin: 1,
    type: 'svg',
    color: { dark: '#1f1a17', light: '#ffffff' },
  });

  res.json({ datos: { ...publico, qr } });
}

/**
 * Darse de alta uno mismo desde la web.
 *
 * Devuelve la tarjeta YA COMPLETA, con su QR y sin telefono ni email, igual
 * que `getTarjeta`. Es lo que permite que el navegador salte directo a la
 * tarjeta recien hecha sin una segunda peticion, y de paso evita que el
 * cliente se quede mirando una pantalla de "listo" sin su codigo delante,
 * que es justo lo que no puede perder.
 */
export async function postAlta(req, res) {
  const socio = await socios.crear(req.body, { via: 'web' });
  const { telefono, email, ...publico } = socio;

  const qr = await QRCode.toString(urlTarjeta(socio.codigo), {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#1f1a17', light: '#ffffff' },
  });

  res.status(201).json({ datos: { ...publico, qr } });
}

// ------------------------------------------------------------------ panel

export async function getSocios(req, res) {
  /*
    `req.consulta` y NO `req.query`.

    El validador deja ahi el resultado ya convertido, porque en Express 5
    `req.query` es de solo lectura -ver `middleware/validar.js`-. Leyendo el
    crudo, `limite` llegaba como la cadena "200" y acababa en el SQL como
    LIMIT '200', que MySQL rechaza. Con `q` no se noto nunca porque una cadena
    cruda y una validada se parecen demasiado.
  */
  res.json({ datos: await socios.buscar(req.consulta) });
}

export async function postSocio(req, res) {
  /*
    La casa del alta sale del token cuando quien da de alta es un encargado, y
    del cuerpo cuando es el admin de grupo, que no esta en ninguna sala.
  */
  const restauranteId = req.usuario.restaurante_id ?? req.body.restaurante_id ?? null;
  const socio = await socios.crear(req.body, { restauranteId });
  res.status(201).json({ datos: socio });
}

export async function postVisita(req, res) {
  /*
    La casa la pone el token, NO el cuerpo de la peticion.

    Un encargado solo puede apuntar visitas en la suya: si viniera por
    parametro, cualquiera con sesion podria sumarle visitas a un socio en una
    casa que no es la suya, y el premio lo paga esa otra casa.
  */
  const restauranteId = req.usuario.restaurante_id ?? req.body.restaurante_id;
  if (!restauranteId) {
    throw ApiError.peticionInvalida('Indica en que local se apunta la visita');
  }

  const tarjeta = await socios.apuntarVisita(req.params.codigo, {
    restauranteId,
    usuarioId: req.usuario.id,
    nota: req.body.nota ?? null,
  });

  res.json({ datos: tarjeta });
}

export async function postEntregarPremio(req, res) {
  const tarjeta = await socios.entregarPremio(req.params.premioId, {
    usuarioId: req.usuario.id,
    nota: req.body?.nota ?? null,
  });
  res.json({ datos: tarjeta });
}

/**
 * El QR de una tarjeta, en SVG y PNG.
 *
 * Mismo criterio que el de las cartas: el SVG es el que va a imprenta porque
 * escala sin pixelarse, y el PNG sirve para mandarlo por WhatsApp.
 */
export async function getQr(req, res) {
  const tarjeta = await socios.porCodigo(req.params.codigo);
  const url = urlTarjeta(tarjeta.codigo);

  const opciones = {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#1f1a17', light: '#ffffff' },
  };

  const [svg, png] = await Promise.all([
    QRCode.toString(url, { ...opciones, type: 'svg' }),
    QRCode.toDataURL(url, { ...opciones, width: 1024 }),
  ]);

  res.json({
    datos: {
      codigo: tarjeta.codigo,
      nombre: tarjeta.nombre,
      url,
      svg,
      png,
      // Igual que en Compartir carta: si esto apunta a localhost, el QR solo
      // funciona en este ordenador y hay que decirlo antes de imprimir nada.
      listoParaImprimir: !/localhost|127\.0\.0\.1/.test(url),
    },
  });
}
