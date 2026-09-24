import { useEffect, useState } from 'react';
import { apiFetch } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function GestionUsuariosPage() {
  const { token, usuario } = useAuth();
  const [pendientes, setPendientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  const cargarPendientes = () => {
    apiFetch('/gestion-usuarios/pendientes', { token }).then(d => setPendientes(d.pendientes)).catch(e => setError(e.message));
  };

  const cargarUsuarios = (q = '') => {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    apiFetch(`/gestion-usuarios/usuarios${params}`, { token }).then(d => setUsuarios(d.usuarios)).catch(e => setError(e.message));
  };

  useEffect(() => {
    cargarPendientes();
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => cargarUsuarios(busqueda), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const aprobar = async (id) => {
    setError('');
    try {
      await apiFetch(`/gestion-usuarios/pendientes/${id}/aprobar`, { method: 'POST', token });
      cargarPendientes();
      cargarUsuarios(busqueda);
    } catch (e) { setError(e.message); }
  };

  const rechazar = async (id) => {
    setError('');
    try {
      await apiFetch(`/gestion-usuarios/pendientes/${id}/rechazar`, { method: 'POST', token });
      cargarPendientes();
    } catch (e) { setError(e.message); }
  };

  const eliminar = async (id) => {
    setError('');
    try {
      await apiFetch(`/gestion-usuarios/usuarios/${id}`, { method: 'DELETE', token });
      setConfirmarEliminar(null);
      cargarUsuarios(busqueda);
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Gestión de usuarios</h1>
        <p className="page-subtitle">Administrá las solicitudes y los usuarios de tu universidad.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card">
        <h2>Solicitudes pendientes</h2>
        {pendientes.length === 0 ? (
          <div className="empty-state">No hay solicitudes pendientes.</div>
        ) : (
          <table className="usuarios-table">
            <thead><tr><th>Nombre</th><th>Correo</th><th>Acciones</th></tr></thead>
            <tbody>
              {pendientes.map(p => (
                <tr key={p.id}>
                  <td>{p.nombre} {p.apellido}</td>
                  <td>{p.email}</td>
                  <td className="acciones-cell">
                    <button className="btn btn-primary btn-sm" onClick={() => aprobar(p.id)}>Aprobar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => rechazar(p.id)}>Rechazar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <div className="card-header-row">
          <h2>Usuarios de mi institución</h2>
        </div>
        <input
          className="input-search"
          placeholder="Buscar por nombre o correo…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <table className="usuarios-table">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td>{u.nombre} {u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.rol === 'responsable' ? 'Responsable Institucional' : 'Usuario Institucional'}</td>
                <td className="acciones-cell">
                  {u.id === usuario.id ? (
                    <span className="text-muted">Vos</span>
                  ) : u.rol === 'responsable' ? (
                    <span className="text-muted">—</span>
                  ) : confirmarEliminar === u.id ? (
                    <>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(u.id)}>Confirmar</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
                    </>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmarEliminar(u.id)}>Eliminar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
