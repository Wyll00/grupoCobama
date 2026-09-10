import { Fragment as Fragmento } from 'react';
import { ui } from '../datos/idioma.js';
import { useIdioma } from '../hooks/useIdioma.js';

/**
 * Una frase traducida con valores destacados dentro.
 *
 *   <Frase clave="res.recibido" valores={{ local: 'La Basílica', hora: '21:00' }} />
 *
 * El problema que resuelve: en la pantalla de "reserva enviada" el nombre del
 * local, la fecha y la hora van en negrita en mitad de la frase. Partir eso en
 * seis cadenas -"Hemos recibido tu solicitud para", "el", "a las"...- lo deja
 * intraducible, porque en aleman el verbo va al final y esos trozos no
 * encajan en ese orden.
 *
 * Asi la traduccion es UNA frase entera con sus huecos, y cada hueco sale
 * destacado. El traductor mueve los huecos donde su idioma los quiera.
 *
 * Los valores se destacan con <strong> por defecto porque son el dato -que
 * dia, a que hora, en que casa-, que es justo lo que alguien vuelve a mirar
 * cuando abre la pagina por segunda vez.
 */
export default function Frase({ clave, valores = {}, marca: Marca = 'strong' }) {
  const [idioma] = useIdioma();
  const plantilla = ui(clave, idioma);

  // Se parte por los huecos CONSERVANDOLOS: con un grupo de captura, split
  // devuelve tambien los separadores, asi que quedan intercalados texto,
  // hueco, texto, hueco... y se distinguen por el nombre.
  const trozos = String(plantilla).split(/\{(\w+)\}/g);

  return (
    <>
      {trozos.map((trozo, i) => {
        // Los pares son texto llano; los impares, nombres de hueco.
        if (i % 2 === 0) return trozo;

        const valor = valores[trozo];
        // Un hueco sin valor se ensena tal cual, con sus llaves: se ve raro en
        // pantalla, que es lo que hace que alguien lo arregle. Callar dejaria
        // una frase con un agujero que nadie relaciona con un dato que falta.
        if (valor === undefined) return `{${trozo}}`;
        // Si el valor ya es un elemento -un enlace, por ejemplo- se pone tal
        // cual: trae su propio aspecto y envolverlo en negrita lo estropea.
        if (typeof valor === 'object') return <Fragmento key={i}>{valor}</Fragmento>;
        return <Marca key={i}>{valor}</Marca>;
      })}
    </>
  );
}
