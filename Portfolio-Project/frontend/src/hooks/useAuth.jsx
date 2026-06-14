import { createContext, useContext, useState } from 'react';
import * as api from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem('rue25_token');
    const stored = localStorage.getItem('rue25_admin');
    return token && stored ? JSON.parse(stored) : null;
  });

  async function loginFn(email, password) {
    const data = await api.login(email, password);
    localStorage.setItem('rue25_token', data.token);
    localStorage.setItem('rue25_admin', JSON.stringify(data.admin));
    setAdmin(data.admin);
  }

  function logout() {
    localStorage.removeItem('rue25_token');
    localStorage.removeItem('rue25_admin');
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, login: loginFn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
