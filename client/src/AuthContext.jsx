import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore the session on page load if a token is saved.
  useEffect(() => {
    if (!localStorage.getItem('token')) { setReady(true); return; }
    api.me().then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setReady(true));
  }, []);

  const signIn = ({ token, user: u }) => { localStorage.setItem('token', token); setUser(u); };
  const signOut = () => { localStorage.removeItem('token'); setUser(null); };

  return <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
