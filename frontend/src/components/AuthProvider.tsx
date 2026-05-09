import { useState, useEffect, useCallback, ReactNode } from 'react';
import {
  AuthContext,
  User,
  getStoredToken,
  storeToken,
  clearToken,
  loginWithGoogle,
  fetchMe,
} from '../services/auth';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      fetchMe(stored)
        .then((u) => {
          setUser(u);
          setToken(stored);
        })
        .catch(() => {
          clearToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credential: string) => {
    const result = await loginWithGoogle(credential);
    storeToken(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
