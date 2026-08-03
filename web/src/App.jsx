import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Restaurante from './pages/Restaurante.jsx';
import Carta from './pages/Carta.jsx';
import Reservar from './pages/Reservar.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';

/**
 * Multi-tenant: no hay una ruta por local. Los cuatro comparten los mismos
 * componentes y solo cambia el :slug. Abrir un quinto local es insertar una
 * fila en `restaurantes`, no tocar este fichero.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="reservar" element={<Reservar />} />
        <Route path=":slug" element={<Restaurante />} />
        <Route path=":slug/carta" element={<Carta />} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
