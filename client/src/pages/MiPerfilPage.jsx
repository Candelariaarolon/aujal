import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function MiPerfilPage() {
  const { usuario, universidad, token, recargarPerfil, actualizarToken, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', confirmPassword: '' });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [candidatos, setCandidatos] = useState([]);
  const [candidatoId, setCandidatoId] = useState('');
  const [transfiriendo, setTransfiriendo] = useState(false);

  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    if (usuario) {
      setForm({ nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, password: '', confirmPassword: '' });
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario?.rol === 'responsable') {
      apiFetch('/gestion-usuarios/usuarios', { token })
        .then(d => setCandidatos(d.usuarios.filter(u => u.rol === 'institucional')))
        .catch(() => {});
    }
  }, [usuario, token]);

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (form.password && form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setGuardando(true);
    try {
      const body = { nombre: form.nombre, apellido: form.apellido, email: form.email };
      if (form.password) body.password = form.password;
      await apiFetch('/perfil', { method: 'PUT', token, body });
      setMensaje('Perfil actualizado.');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
      recargarPerfil();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const transferirRol = async () => {
    if (!candidatoId) return;
    setError('');
    setTransfiriendo(true);
    try {
      const data = await apiFetch('/perfil/transferir-rol', {
        method: 'POST', token, body: { nuevo_responsable_id: Number(candidatoId) },
      });
      actualizarToken(data.token);
      setMensaje(data.mensaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setTransfiriendo(false);
    }
  };

  const eliminarCuenta = async () => {
    setErrorEliminar('');
    try {
      await apiFetch('/perfil', { method: 'DELETE', token });
      logout();
      navigate('/');
    } catch (err) {
      setErrorEliminar(err.message);
    }
  };

  if (!usuario) return <div className="page-loading">Cargando…</div>;

  return (
    <div className="page page--narrow">
      <div className="page-header">
        <h1>Mi perfil</h1>
      </div>

      <section className="card">
        <h2>Datos personales</h2>
        <form onSubmit={onSubmit} className="form">
          <div className="form-row">
            <label className="field">
              <span>Nombre</span>
              <input value={form.nombre} onChange={set('nombre')} required />
            </label>
            <label className="field">
              <span>Apellido</span>
              <input value={form.apellido} onChange={set('apellido')} required />
            </label>
          </div>
          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label className="field">
            <span>Universidad</span>
            <input value={`${universidad?.nombre ?? ''} (${universidad?.pais ?? ''})`} disabled />
          </label>
          <div className="form-row">
            <label className="field">
              <span>Nueva contraseña (opcional)</span>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Dejar en blanco para no cambiar" />
            </label>
            <label className="field">
              <span>Confirmar nueva contraseña</span>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} />
            </label>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {mensaje && <div className="alert alert-success">{mensaje}</div>}

          <button className="btn btn-primary" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </section>

      {usuario.rol === 'responsable' && (
        <section className="card">
          <h2>Transferir rol de Responsable Institucional</h2>
          <p className="card-hint">
            Cada universidad debe tener exactamente un Responsable Institucional activo. Para eliminar tu cuenta,
            primero debés transferir el rol a otro Usuario Institucional de tu universidad.
          </p>
          {candidatos.length === 0 ? (
            <div className="empty-state">No hay otros usuarios institucionales en tu universidad para transferir el rol.</div>
          ) : (
            <div className="form-row form-row--inline">
              <select value={candidatoId} onChange={e => setCandidatoId(e.target.value)}>
                <option value="">Seleccioná un usuario…</option>
                {candidatos.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.apellido} — {c.email}</option>
                ))}
              </select>
              <button className="btn btn-secondary" disabled={!candidatoId || transfiriendo} onClick={transferirRol}>
                {transfiriendo ? 'Transfiriendo…' : 'Transferir rol'}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="card card--danger">
        <h2>Eliminar mi cuenta</h2>
        <p className="card-hint">Esta acción no afectará los datos institucionales ni los indicadores cargados por tu universidad.</p>
        {errorEliminar && <div className="alert alert-error">{errorEliminar}</div>}
        {confirmarEliminar ? (
          <div className="form-row form-row--inline">
            <span>¿Confirmás que querés eliminar tu cuenta?</span>
            <button className="btn btn-danger" onClick={eliminarCuenta}>Sí, eliminar</button>
            <button className="btn btn-ghost" onClick={() => setConfirmarEliminar(false)}>Cancelar</button>
          </div>
        ) : (
          <button className="btn btn-danger" onClick={() => setConfirmarEliminar(true)}>Eliminar mi cuenta</button>
        )}
      </section>
    </div>
  );
}
