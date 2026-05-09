import { createContext, useContext } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const TOKEN_KEY = 'tutr_jwt';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (googleCredential: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginWithGoogle(credential: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function fetchMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Invalid session');
  const data = await res.json();
  return data.user;
}
