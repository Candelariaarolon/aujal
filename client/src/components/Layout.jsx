import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { usuario, universidad, logout } = useAuth();
  const esResponsable = usuario?.rol === 'responsable';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-mark">🌱</span>
          <div>
            <div className="brand-title">AUSJAL Sustentabilidad</div>
            <div className="brand-subtitle">Red de indicadores</div>
          </div>
        </div>

        <nav className="topbar-nav">
          <NavLink to="/inicio" className="nav-link">Inicio</NavLink>
          <NavLink to="/universidades" className="nav-link">Universidades</NavLink>
          <NavLink to="/comparar" className="nav-link">Comparar indicadores</NavLink>
          <NavLink to="/mi-universidad" className="nav-link">Mi universidad</NavLink>
          {esResponsable && <NavLink to="/gestion-usuarios" className="nav-link">Gestión de usuarios</NavLink>}
          <NavLink to="/mi-perfil" className="nav-link">Mi perfil</NavLink>
        </nav>

        <div className="topbar-user">
          <div className="user-chip">
            <span className="user-name">{usuario?.nombre} {usuario?.apellido}</span>
            <span className="user-meta">{universidad?.nombre} · {esResponsable ? 'Responsable' : 'Usuario institucional'}</span>
          </div>
          <button className="btn btn-ghost" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
