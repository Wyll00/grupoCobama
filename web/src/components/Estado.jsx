export function Cargando({ texto = 'Cargando...' }) {
  return (
    <p className="cargando" role="status">
      {texto}
    </p>
  );
}

export function Error({ error }) {
  return (
    <div className="contenedor seccion">
      <div className="aviso">
        <strong>No se han podido cargar los datos.</strong>
        <br />
        {error?.message}
        <br />
        <span className="apagado">
          Comprueba que la API esta levantada en el puerto 4000 (npm run dev --prefix api).
        </span>
      </div>
    </div>
  );
}

export function EstadoApertura({ abierto }) {
  return (
    <span className={`estado ${abierto ? 'estado--abierto' : 'estado--cerrado'}`}>
      {abierto ? 'Abierto ahora' : 'Cerrado ahora'}
    </span>
  );
}
