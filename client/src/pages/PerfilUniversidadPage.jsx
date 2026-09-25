import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import EstadoBadge from '../components/EstadoBadge.jsx';

function DimensionAccordion({ dimension, esEditable, ediciones, onCambiarDato, abierta, onToggle }) {
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
                const valorEdicion = ediciones[ind.id];
                const valorMostrado = esEditable ? (valorEdicion ?? ind.dato_registrado ?? '') : ind.dato_registrado;
                const sinCriterio = ind.estado === 'sin_informacion' && !!ind.dato_registrado;
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
                          onChange={e => onCambiarDato(ind.id, e.target.value)}
                        />
                      ) : (
                        ind.dato_registrado ? ind.dato_registrado : <span className="text-muted">Sin información</span>
                      )}
                    </td>
                    <td className="col-estado">
                      <EstadoBadge estado={ind.estado} size="sm" />
                      {sinCriterio && (
                        <div className="ind-sin-criterio">Sin criterio de evaluación definido aún</div>
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

  const onCambiarDato = (indicadorId, valor) => {
    setEdiciones(prev => ({ ...prev, [indicadorId]: valor }));
  };

  const guardarDimension = async (dimension) => {
    setGuardando(true);
    setMensaje('');
    try {
      const cambios = dimension.indicadores.filter(ind => ediciones[ind.id] !== undefined);
      await Promise.all(cambios.map(ind => (
        apiFetch(`/indicadores/${ind.id}/valor`, {
          method: 'PUT',
          token,
          body: { dato_registrado: ediciones[ind.id] || null },
        })
      )));
      setMensaje(`Información de "${dimension.nombre}" guardada. El estado se calculó automáticamente a partir del dato.`);
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
      {editando && (
        <div className="alert alert-info">
          El color del semáforo se calcula automáticamente a partir del dato que cargues — no se elige manualmente.
          Algunos indicadores todavía no tienen un criterio de evaluación definido por AUSJAL: en esos casos el dato
          queda registrado, pero el estado se muestra como "Sin información" hasta que se defina el criterio.
        </div>
      )}

      <div className="accordion">
        {perfil.dimensiones.map(dim => (
          <div key={dim.id}>
            <DimensionAccordion
              dimension={dim}
              esEditable={editando}
              ediciones={ediciones}
              onCambiarDato={onCambiarDato}
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
