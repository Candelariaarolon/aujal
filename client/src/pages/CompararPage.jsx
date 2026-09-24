import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ORDEN_ESTADOS, estadoInfo } from '../estados.js';

export default function CompararPage() {
  const { token } = useAuth();
  const [dimensiones, setDimensiones] = useState([]);
  const [dimensionId, setDimensionId] = useState(null);
  const [indicadores, setIndicadores] = useState([]);
  const [indicadorId, setIndicadorId] = useState(null);
  const [comparacion, setComparacion] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/dimensiones', { token }).then(d => setDimensiones(d.dimensiones)).catch(e => setError(e.message));
  }, [token]);

  useEffect(() => {
    if (!dimensionId) { setIndicadores([]); return; }
    setIndicadorId(null);
    setComparacion(null);
    apiFetch(`/dimensiones/${dimensionId}/indicadores`, { token })
      .then(d => setIndicadores(d.indicadores))
      .catch(e => setError(e.message));
  }, [dimensionId, token]);

  useEffect(() => {
    if (!indicadorId) { setComparacion(null); return; }
    apiFetch(`/indicadores/${indicadorId}/comparacion`, { token })
      .then(setComparacion)
      .catch(e => setError(e.message));
  }, [indicadorId, token]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Comparar indicadores</h1>
        <p className="page-subtitle">
          Elegí una dimensión y un indicador para ver cómo se agrupan las universidades según su estado.
          Dentro de cada grupo, las universidades se muestran en orden alfabético: no se establecen rankings.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stepper">
        <div className="step">
          <div className="step-label">1. Dimensión</div>
          <div className="chip-list">
            {dimensiones.map(d => (
              <button
                key={d.id}
                className={`chip ${dimensionId === d.id ? 'chip--active' : ''}`}
                onClick={() => setDimensionId(d.id)}
              >
                {d.nombre}
              </button>
            ))}
          </div>
        </div>

        {dimensionId && (
          <div className="step">
            <div className="step-label">2. Indicador</div>
            <div className="chip-list">
              {indicadores.map(i => (
                <button
                  key={i.id}
                  className={`chip ${indicadorId === i.id ? 'chip--active' : ''}`}
                  onClick={() => setIndicadorId(i.id)}
                  title={i.descripcion || ''}
                >
                  {i.codigo}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {comparacion && (
        <div className="comparacion-resultado">
          <div className="comparacion-header">
            <div className="tag-ausjal-outline">{comparacion.indicador.codigo}</div>
            <h2>{comparacion.indicador.nombre}</h2>
            {comparacion.indicador.descripcion && <p className="card-hint">{comparacion.indicador.descripcion}</p>}
          </div>

          <div className="grupos-grid">
            {ORDEN_ESTADOS.map(estado => {
              const universidades = comparacion.grupos[estado] || [];
              const info = estadoInfo(estado);
              return (
                <div key={estado} className="grupo-card" style={{ borderTopColor: info.color }}>
                  <div className="grupo-header">
                    <span>{info.emoji} {info.label}</span>
                    <span className="grupo-count">{universidades.length}</span>
                  </div>
                  {universidades.length === 0 ? (
                    <div className="grupo-vacio">—</div>
                  ) : (
                    <ul className="grupo-lista">
                      {universidades.map(u => (
                        <li key={u.id}>
                          <Link to={`/universidades/${u.id}`}>{u.nombre}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
