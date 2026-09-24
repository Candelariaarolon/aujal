import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function UniversidadesPage() {
  const { token } = useAuth();
  const [universidades, setUniversidades] = useState([]);
  const [paises, setPaises] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [pais, setPais] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/universidades/paises', { token }).then(d => setPaises(d.paises)).catch(() => {});
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (busqueda) params.set('q', busqueda);
    if (pais) params.set('pais', pais);
    const timeout = setTimeout(() => {
      apiFetch(`/universidades?${params.toString()}`, { token })
        .then(d => setUniversidades(d.universidades))
        .catch(e => setError(e.message));
    }, 200);
    return () => clearTimeout(timeout);
  }, [busqueda, pais, token]);

  const sinResultados = useMemo(() => universidades.length === 0, [universidades]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Universidades</h1>
        <p className="page-subtitle">Consultá el perfil institucional de cada universidad participante de la Red AUSJAL.</p>
      </div>

      <div className="filtros-row">
        <input
          className="input-search"
          placeholder="Buscar universidad por nombre…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select value={pais} onChange={e => setPais(e.target.value)}>
          <option value="">Todos los países</option>
          {paises.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {sinResultados ? (
        <div className="empty-state">No se encontraron universidades con esos criterios.</div>
      ) : (
        <div className="uni-grid uni-grid--large">
          {universidades.map(u => (
            <Link key={u.id} to={`/universidades/${u.id}`} className="uni-card uni-card--large">
              <span className="uni-escudo uni-escudo--lg">{u.escudo_emoji}</span>
              <div>
                <div className="uni-nombre">{u.nombre}</div>
                <div className="uni-pais">{u.pais}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
