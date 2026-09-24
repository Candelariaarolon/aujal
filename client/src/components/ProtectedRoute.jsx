import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ roles }) {
  const { usuario, loading } = useAuth();

  if (loading) return <div className="page-loading">Cargando…</div>;
  if (!usuario) return <Navigate to="/" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/inicio" replace />;

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { usuario, loading } = useAuth();
  if (loading) return <div className="page-loading">Cargando…</div>;
  if (usuario) return <Navigate to="/inicio" replace />;
  return <Outlet />;
}
