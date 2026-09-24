import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function MiUniversidadRedirect() {
  const { usuario, loading } = useAuth();
  if (loading) return <div className="page-loading">Cargando…</div>;
  return <Navigate to={`/universidades/${usuario.universidad_id}`} replace />;
}
