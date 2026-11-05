import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';

const STORAGE_KEY = 'bugboard26.session';
const AuthContext = createContext(null);
function readSession() { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch { return null; } }

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const login = useCallback(async (credentials) => {
    const result = await apiRequest('/auth/login', { method: 'POST', body: credentials });
    const next = { token: result.accessToken, user: result.user, expiresIn: result.expiresIn };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSession(next); return next;
  }, []);
  const logout = useCallback(() => { sessionStorage.removeItem(STORAGE_KEY); setSession(null); }, []);
  const value = useMemo(() => ({ session, token: session?.token, user: session?.user, login, logout }), [session, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
