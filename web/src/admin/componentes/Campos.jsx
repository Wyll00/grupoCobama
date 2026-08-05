export function Campo({ etiqueta, ayuda, error, children }) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">{etiqueta}</span>
      {children}
      {ayuda && !error && <span className="campo__ayuda">{ayuda}</span>}
      {error && <span className="campo__error">{error}</span>}
    </label>
  );
}

export function Entrada(props) {
  return <input className="entrada" {...props} />;
}

export function AreaTexto(props) {
  return <textarea className="entrada" rows={3} {...props} />;
}

export function Seleccion({ children, ...props }) {
  return (
    <select className="entrada" {...props}>
      {children}
    </select>
  );
}

export function Interruptor({ etiqueta, checked, onChange, disabled }) {
  return (
    <label className={`interruptor ${disabled ? 'interruptor--inactivo' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span>{etiqueta}</span>
    </label>
  );
}

export function Boton({ variante = 'secundario', children, ...props }) {
  return (
    <button className={`btn btn--${variante}`} type="button" {...props}>
      {children}
    </button>
  );
}

export function Aviso({ tipo = 'info', children }) {
  if (!children) return null;
  return <div className={`admin-aviso admin-aviso--${tipo}`}>{children}</div>;
}
