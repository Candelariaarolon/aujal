import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [universidades, setUniversidades] = useState([]);
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', universidad_id: '', password: '', confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    apiFetch('/universidades/publicas').then(d => setUniversidades(d.universidades)).catch(() => {});
  }, []);

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    try {
      await registro({ ...form, universidad_id: Number(form.universidad_id) });
      setMensaje('Tu cuenta fue creada y quedó pendiente de aprobación por el Responsable Institucional de tu universidad.');
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-brand">
          <span className="brand-mark brand-mark--lg">🌱</span>
          <h1>Crear cuenta</h1>
          <p>Registrate para acceder a la plataforma de indicadores de tu universidad</p>
        </div>

        <form onSubmit={onSubmit} className="form">
          <div className="form-row">
            <label className="field">
              <span>Nombre</span>
              <input required value={form.nombre} onChange={set('nombre')} />
            </label>
            <label className="field">
              <span>Apellido</span>
              <input required value={form.apellido} onChange={set('apellido')} />
            </label>
          </div>

          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" required value={form.email} onChange={set('email')} />
          </label>

          <label className="field">
            <span>Universidad</span>
            <select required value={form.universidad_id} onChange={set('universidad_id')}>
              <option value="" disabled>Seleccioná tu universidad…</option>
              {universidades.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} — {u.pais}</option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label className="field">
              <span>Contraseña</span>
              <input type="password" required value={form.password} onChange={set('password')} />
            </label>
            <label className="field">
              <span>Confirmar contraseña</span>
              <input type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
            </label>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {mensaje && <div className="alert alert-success">{mensaje}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={cargando}>
            {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <div className="auth-links">
            <Link to="/">Volver a iniciar sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
