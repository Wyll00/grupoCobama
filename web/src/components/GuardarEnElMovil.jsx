import { useEffect, useState } from 'react';

/**
 * "Guarda la tarjeta en tu movil".
 *
 * Sin esto, lo de poder instalarla no existe: nadie abre el menu del navegador
 * a ver que hay. Hay que decirselo, y decirselo distinto segun el movil,
 * porque los dos sistemas no se parecen en nada aqui:
 *
 *   Android  El navegador avisa a la pagina de que se puede instalar
 *            -`beforeinstallprompt`- y deja abrir el dialogo cuando se quiera.
 *            Asi que hay boton de verdad: se pulsa y sale el dialogo del
 *            sistema. Si el navegador no avisa, es que ya esta instalada o que
 *            ese navegador no lo admite, y entonces no se ensena nada.
 *
 *   iOS      No hay API ninguna. Lo unico que se puede hacer es explicarle los
 *            dos toques: Compartir y "Anadir a pantalla de inicio". Por eso en
 *            iPhone esto no es un boton, son unas instrucciones; un boton que
 *            no hace nada al pulsarlo es peor que no tener boton.
 *
 * Y si ya esta instalada no sale nada, claro: la pagina se esta viendo DENTRO
 * del icono que invitaria a crear.
 */

const esIOS = () =>
  // El iPad moderno se declara Macintosh, asi que el truco de los puntos
  // tactiles es lo que lo distingue de un Mac de verdad.
  /iphone|ipod/i.test(navigator.userAgent) ||
  (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

const yaInstalada = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // Lo de Apple, que no sigue el estandar.
  window.navigator.standalone === true;

export default function GuardarEnElMovil() {
  const [invitacion, setInvitacion] = useState(null);
  const [explicandoIOS, setExplicandoIOS] = useState(false);
  const [instalada, setInstalada] = useState(yaInstalada);

  useEffect(() => {
    const alPoder = (e) => {
      // Sin esto, Chrome ensena su propia barrita cuando le parece. Cortandolo
      // aqui, el momento lo elige la pagina: cuando el cliente esta mirando su
      // tarjeta, que es cuando guardarla tiene sentido.
      e.preventDefault();
      setInvitacion(e);
    };
    const alInstalar = () => {
      setInstalada(true);
      setInvitacion(null);
    };

    window.addEventListener('beforeinstallprompt', alPoder);
    window.addEventListener('appinstalled', alInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoder);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  if (instalada) return null;

  const instalar = async () => {
    if (!invitacion) return;
    invitacion.prompt();
    const { outcome } = await invitacion.userChoice;
    // La invitacion es de un solo uso: una vez contestada ya no vale, asi que
    // se tira tanto si acepto como si no. Si dijo que no, se le vuelve a
    // ofrecer la proxima vez que entre, no en el mismo rato.
    setInvitacion(null);
    if (outcome === 'accepted') setInstalada(true);
  };

  if (esIOS()) {
    return (
      <div className="guardar-movil">
        {explicandoIOS ? (
          <ol className="guardar-movil__pasos">
            <li>
              Dale a <strong>Compartir</strong>, el cuadrado con la flecha hacia arriba.
            </li>
            <li>
              Baja y elige <strong>Añadir a pantalla de inicio</strong>.
            </li>
            <li>Te queda el sello de Cobama junto a tus apps.</li>
          </ol>
        ) : (
          <button type="button" className="enlace" onClick={() => setExplicandoIOS(true)}>
            Guarda la tarjeta en tu móvil
          </button>
        )}
      </div>
    );
  }

  if (!invitacion) return null;

  return (
    <div className="guardar-movil">
      <button type="button" className="boton" onClick={instalar}>
        Guardar la tarjeta en el móvil
      </button>
      <p className="apagado guardar-movil__nota">
        Te queda un icono junto a tus apps y la abres sin buscar nada.
      </p>
    </div>
  );
}
