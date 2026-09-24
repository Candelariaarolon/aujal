import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ESTADOS, ORDEN_ESTADOS } from '../estados.js';

const ESTADOS_COLOR = ORDEN_ESTADOS.filter(e => e !== 'sin_informacion');

function BarraSemaforo({ porcentajes, total }) {
  if (!total) {
    return <div className="semaforo-vacio">Todavía no hay indicadores evaluados en la red.</div>;
  }
  return (
    <div className="semaforo-bar">
      {ESTADOS_COLOR.map(estado => (
        porcentajes[estado] > 0 && (
          <div
            key={estado}
            className="semaforo-segment"
            style={{ width: `${porcentajes[estado]}%`, background: ESTADOS[estado].color }}
            title={`${ESTADOS[estado].label}: ${porcentajes[estado]}%`}
          />
        )
      ))}
    </div>
  );
}

export default function HomePage() {
  const { token } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/red/resumen', { token }).then(setResumen).catch(e => setError(e.message));
  }, [token]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!resumen) return <div className="page-loading">Cargando…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Estado de la Red AUSJAL</h1>
        <p className="page-subtitle">
          Una visión conjunta del avance de la red hacia una universidad más sustentable. No se muestran posiciones
          ni comparaciones entre instituciones: el objetivo es el seguimiento y la mejora colectiva.
        </p>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Estado de los indicadores reportados</h2>
          <p className="card-hint">Distribución de los indicadores que cuentan con información suficiente para ser evaluados.</p>
          <BarraSemaforo porcentajes={resumen.estado_indicadores.porcentajes} total={resumen.estado_indicadores.total} />
          <ul className="legend-list">
            {ESTADOS_COLOR.map(estado => (
              <li key={estado}>
                <span className="legend-dot" style={{ background: ESTADOS[estado].color }} />
                {ESTADOS[estado].label}
                <strong>{resumen.estado_indicadores.porcentajes[estado]}%</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Cobertura de información</h2>
          <p className="card-hint">Porcentaje de la información esperada que fue efectivamente cargada por las universidades.</p>
          <div className="cobertura-wrap">
            <div className="cobertura-track">
              <div className="cobertura-fill" style={{ width: `${resumen.cobertura}%` }} />
            </div>
            <div className="cobertura-numeros">
              <span className="cobertura-valor">{resumen.cobertura}%</span>
              <span className="cobertura-meta">Meta de la red: {resumen.meta_cobertura}%</span>
            </div>
          </div>
          <p className="card-footnote">
            100% de cobertura no significa 100% de sustentabilidad: significa que toda la información esperada está disponible.
          </p>
        </section>
      </div>

      <section className="card">
        <h2>Estado agregado por dimensión</h2>
        <p className="card-hint">Situación conjunta de la red en cada dimensión de sustentabilidad.</p>
        <div className="dimension-list">
          {resumen.por_dimension.map(d => (
            <div key={d.dimension} className="dimension-row">
              <span className="dimension-nombre">{d.dimension}</span>
              <BarraSemaforo porcentajes={d.porcentajes} total={d.total} />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>Universidades participantes</h2>
          <Link className="link-button" to="/universidades">Ver todas →</Link>
        </div>
        <div className="uni-grid">
          {resumen.universidades.map(u => (
            <Link key={u.id} to={`/universidades/${u.id}`} className="uni-card">
              <span className="uni-escudo">{u.escudo_emoji}</span>
              <div>
                <div className="uni-nombre">{u.nombre}</div>
                <div className="uni-pais">{u.pais}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
