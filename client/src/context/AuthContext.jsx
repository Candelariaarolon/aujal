import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ausjal_token'));
  const [usuario, setUsuario] = useState(null);
  const [universidad, setUniversidad] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarPerfil = useCallback(async (tok) => {
    if (!tok) {
      setUsuario(null);
      setUniversidad(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch('/auth/me', { token: tok });
      setUsuario(data.usuario);
      setUniversidad(data.universidad);
    } catch {
      localStorage.removeItem('ausjal_token');
      setToken(null);
      setUsuario(null);
      setUniversidad(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('ausjal_token', data.token);
    setToken(data.token);
    await cargarPerfil(data.token);
    return data;
  };

  const registro = async (payload) => {
    return apiFetch('/auth/registro', { method: 'POST', body: payload });
  };

  const logout = () => {
    localStorage.removeItem('ausjal_token');
    setToken(null);
    setUsuario(null);
    setUniversidad(null);
  };

  const actualizarToken = (nuevoToken) => {
    localStorage.setItem('ausjal_token', nuevoToken);
    setToken(nuevoToken);
    cargarPerfil(nuevoToken);
  };

  const recargarPerfil = () => cargarPerfil(token);

  return (
    <AuthContext.Provider value={{
      token, usuario, universidad, loading,
      login, logout, registro, actualizarToken, recargarPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
