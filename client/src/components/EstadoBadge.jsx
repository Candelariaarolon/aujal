import { estadoInfo } from '../estados.js';

export default function EstadoBadge({ estado, size = 'md' }) {
  const info = estadoInfo(estado);
  return (
    <span
      className={`estado-badge estado-badge--${size}`}
      style={{ color: info.color, background: info.bg }}
    >
      <span className="estado-dot" style={{ background: info.color }} />
      {info.label}
    </span>
  );
}
