import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';

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
