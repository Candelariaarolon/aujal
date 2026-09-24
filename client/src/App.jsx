import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import HomePage from './pages/HomePage.jsx';
import UniversidadesPage from './pages/UniversidadesPage.jsx';
import PerfilUniversidadPage from './pages/PerfilUniversidadPage.jsx';
import CompararPage from './pages/CompararPage.jsx';
import GestionUsuariosPage from './pages/GestionUsuariosPage.jsx';
import MiPerfilPage from './pages/MiPerfilPage.jsx';
import MiUniversidadRedirect from './pages/MiUniversidadRedirect.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/crear-cuenta" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/inicio" element={<HomePage />} />
            <Route path="/universidades" element={<UniversidadesPage />} />
            <Route path="/universidades/:id" element={<PerfilUniversidadPage />} />
            <Route path="/comparar" element={<CompararPage />} />
            <Route path="/mi-universidad" element={<MiUniversidadRedirect />} />
            <Route path="/mi-perfil" element={<MiPerfilPage />} />
            <Route element={<ProtectedRoute roles={['responsable']} />}>
              <Route path="/gestion-usuarios" element={<GestionUsuariosPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
