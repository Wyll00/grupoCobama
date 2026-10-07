import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';

/*
  El service worker, solo en la web compilada.

  En desarrollo NO se registra, y es a proposito: Vite sirve los modulos uno a
  uno y los recompila al vuelo, y un intermediario cacheando por medio es la
  forma mas rapida de pasarse media hora depurando un cambio que ya estaba
  hecho. En este proyecto ya se perdio una tarde con la cache de Vite.

  Se registra despues de `load` para no competir por el ancho de banda con lo
  que hace falta para pintar la primera pantalla.
*/
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Si falla, la web funciona igual: se pierde abrir sin cobertura y que
      // Android ofrezca instalar, no la web. No hay nada que avisarle a nadie.
    });
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*
      v7_startTransition: el panel se carga con React.lazy y, sin esta bandera,
      react-router hace el cambio de ruta como actualizacion sincrona. React
      protesta ("a component suspended while responding to synchronous input")
      y corta el render en seco en lugar de esperar al chunk.
      v7_relativeSplatPath: solo silencia el aviso de migracion; ya no usamos
      rutas comodin.
    */}
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
