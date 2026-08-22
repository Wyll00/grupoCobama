import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Restaurante from './pages/Restaurante.jsx';
import Carta from './pages/Carta.jsx';
import Reservar from './pages/Reservar.jsx';
import Privacidad from './pages/Privacidad.jsx';
import AvisoLegal from './pages/AvisoLegal.jsx';
import Galeria from './pages/Galeria.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';
import { rutasAdmin } from './admin/rutas.jsx';

/**
 * Multi-tenant: no hay una ruta por local. Los cuatro comparten los mismos
 * componentes y solo cambia el :slug. Abrir un quinto local es insertar una
 * fila en `restaurantes`, no tocar este fichero.
 */
export default function App() {
  return (
    <Routes>
      {rutasAdmin()}

      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="reservar" element={<Reservar />} />
        {/* Antes de :slug a proposito. React Router puntua mas alto un
            segmento fijo que uno dinamico, asi que /privacidad no cae en la
            ficha de un local llamado "privacidad"; pero dejarlo escrito en
            este orden evita que alguien lo reordene sin darse cuenta. */}
        <Route path="privacidad" element={<Privacidad />} />
        <Route path="aviso-legal" element={<AvisoLegal />} />
        <Route path="galeria" element={<Galeria />} />
        <Route path=":slug" element={<Restaurante />} />
        <Route path=":slug/carta" element={<Carta />} />
        <Route path=":slug/galeria" element={<Galeria />} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
