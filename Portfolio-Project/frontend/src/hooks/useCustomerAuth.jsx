import { createContext, useContext, useState } from 'react';

const CustomerAuthContext = createContext(null);

const TOKEN_KEY = 'rue25_user_token';
const USER_KEY  = 'rue25_user';

export function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const stored = localStorage.getItem(USER_KEY);
      return token && stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  function saveSession(token, userData) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  return (
    <CustomerAuthContext.Provider value={{ user, saveSession, logout, getToken }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => useContext(CustomerAuthContext);
