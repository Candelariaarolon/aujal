import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [avisoReset, setAvisoReset] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email, password);
      navigate('/inicio');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark brand-mark--lg">🌱</span>
          <h1>AUSJAL Sustentabilidad</h1>
          <p>Plataforma de indicadores de sustentabilidad de la Red AUSJAL</p>
        </div>

        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span>Correo electrónico</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@universidad.edu" />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>

          <div className="auth-links">
            <button type="button" className="link-button" onClick={() => setAvisoReset(true)}>¿Olvidaste tu contraseña?</button>
            <Link to="/crear-cuenta">Crear cuenta</Link>
          </div>

          {avisoReset && (
            <div className="alert alert-info">
              La recuperación de contraseña automática no está disponible en esta primera versión. Contactá al Responsable Institucional de tu universidad.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
