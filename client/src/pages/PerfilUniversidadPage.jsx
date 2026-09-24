import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import EstadoBadge from '../components/EstadoBadge.jsx';
import { ORDEN_ESTADOS, estadoInfo } from '../estados.js';

const ESTADOS_SELECCIONABLES = ORDEN_ESTADOS;

function DimensionAccordion({ dimension, esEditable, ediciones, onCambiarEdicion, abierta, onToggle }) {
  const conDatos = dimension.indicadores.filter(i => i.dato_registrado !== null).length;

  return (
    <div className="accordion-item">
      <button className="accordion-header" onClick={onToggle}>
        <span className="accordion-title">{dimension.nombre}</span>
        <span className="accordion-meta">{conDatos}/{dimension.indicadores.length} con información</span>
        <span className="accordion-caret">{abierta ? '▾' : '▸'}</span>
      </button>

      {abierta && (
        <div className="accordion-body">
          <table className="indicadores-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Indicador</th>
                <th>Unidad</th>
                <th>Dato registrado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {dimension.indicadores.map(ind => {
                const edicion = ediciones[ind.id];
                const valorMostrado = esEditable ? (edicion?.dato_registrado ?? ind.dato_registrado ?? '') : ind.dato_registrado;
                const estadoMostrado = esEditable ? (edicion?.estado ?? ind.estado) : ind.estado;
                return (
                  <tr key={ind.id}>
                    <td className="col-codigo">
                      {ind.codigo}
                      {ind.es_ausjal && <span className="tag-ausjal">AUSJAL</span>}
                    </td>
                    <td>
                      <div className="ind-nombre">{ind.nombre}</div>
                      {ind.descripcion && <div className="ind-descripcion">{ind.descripcion}</div>}
                      {ind.formula && <div className="ind-formula">Método: {ind.formula}</div>}
                    </td>
                    <td className="col-unidad">{ind.unidad || '—'}</td>
                    <td className="col-dato">
                      {esEditable ? (
                        <input
                          value={valorMostrado}
                          placeholder="Sin información"
                          onChange={e => onCambiarEdicion(ind.id, { dato_registrado: e.target.value, estado: edicion?.estado ?? ind.estado })}
                        />
                      ) : (
                        ind.dato_registrado ? ind.dato_registrado : <span className="text-muted">Sin información</span>
                      )}
                    </td>
                    <td className="col-estado">
                      {esEditable ? (
                        <select
                          value={estadoMostrado}
                          onChange={e => onCambiarEdicion(ind.id, { dato_registrado: edicion?.dato_registrado ?? ind.dato_registrado ?? '', estado: e.target.value })}
                        >
                          {ESTADOS_SELECCIONABLES.map(e => (
                            <option key={e} value={e}>{estadoInfo(e).emoji} {estadoInfo(e).label}</option>
                          ))}
                        </select>
                      ) : (
                        <EstadoBadge estado={ind.estado} size="sm" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PerfilUniversidadPage() {
  const { id } = useParams();
  const { token, usuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(false);
  const [ediciones, setEdiciones] = useState({});
  const [dimensionAbierta, setDimensionAbierta] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargar = () => {
    setError('');
    apiFetch(`/universidades/${id}`, { token })
      .then(data => {
        setPerfil(data);
        setDimensionAbierta(data.dimensiones[0]?.id ?? null);
      })
      .catch(e => setError(e.message));
  };

  useEffect(() => {
    setEditando(false);
    setEdiciones({});
    setMensaje('');
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!perfil) return <div className="page-loading">Cargando…</div>;

  const puedeGestionar = perfil.es_mi_universidad && usuario.rol === 'responsable';

  const onCambiarEdicion = (indicadorId, valores) => {
    setEdiciones(prev => ({ ...prev, [indicadorId]: valores }));
  };

  const guardarDimension = async (dimension) => {
    setGuardando(true);
    setMensaje('');
    try {
      const cambios = dimension.indicadores.filter(ind => ediciones[ind.id]);
      await Promise.all(cambios.map(ind => {
        const { dato_registrado, estado } = ediciones[ind.id];
        return apiFetch(`/indicadores/${ind.id}/valor`, {
          method: 'PUT',
          token,
          body: { dato_registrado: dato_registrado || null, estado },
        });
      }));
      setMensaje(`Información de "${dimension.nombre}" guardada.`);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="page">
      <div className="perfil-header">
        <span className="uni-escudo uni-escudo--xl">{perfil.universidad.escudo_emoji}</span>
        <div className="perfil-header-info">
          <h1>{perfil.universidad.nombre}</h1>
          <p className="page-subtitle">{perfil.universidad.pais}</p>
        </div>
        <div className="perfil-header-actions">
          <div className="cobertura-chip">
            <span>Cobertura</span>
            <strong>{perfil.cobertura}%</strong>
          </div>
          {puedeGestionar && (
            <button className="btn btn-primary" onClick={() => { setEditando(v => !v); setEdiciones({}); setMensaje(''); }}>
              {editando ? 'Salir de edición' : 'Gestionar indicadores'}
            </button>
          )}
        </div>
      </div>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="accordion">
        {perfil.dimensiones.map(dim => (
          <div key={dim.id}>
            <DimensionAccordion
              dimension={dim}
              esEditable={editando}
              ediciones={ediciones}
              onCambiarEdicion={onCambiarEdicion}
              abierta={dimensionAbierta === dim.id}
              onToggle={() => setDimensionAbierta(a => a === dim.id ? null : dim.id)}
            />
            {editando && dimensionAbierta === dim.id && (
              <div className="accordion-save-row">
                <button className="btn btn-primary" disabled={guardando} onClick={() => guardarDimension(dim)}>
                  {guardando ? 'Guardando…' : 'Guardar información'}
                </button>
                <span className="card-footnote">Podés cargar solo los indicadores de los que dispongas información.</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
