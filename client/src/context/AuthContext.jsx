import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vos_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vos_token');
    if (token) {
      api.get('/auth/me')
        .then(r => { setUser(r.data.user); localStorage.setItem('vos_user', JSON.stringify(r.data.user)); })
        .catch(() => { localStorage.removeItem('vos_token'); localStorage.removeItem('vos_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('vos_token', data.token);
    localStorage.setItem('vos_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('vos_token');
    localStorage.removeItem('vos_user');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, logout, loading }}>{children}</AuthCtx.Provider>;
}
