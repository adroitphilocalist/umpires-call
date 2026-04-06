'use client';

import { create } from 'zustand';
import { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  dbUser: any | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setDbUser: (dbUser: any | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  dbUser: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  setDbUser: (dbUser) => set({ dbUser }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Strict';
    document.cookie = 'user-data=; path=/; max-age=0; SameSite=Strict';
    localStorage.removeItem('umpires_call_user');
    set({ user: null, dbUser: null, token: null, isAuthenticated: false });
  },
}));

export const initializeAuth = () => {
  const { setUser, setDbUser, setToken, setLoading } = useAuthStore.getState();

  const decodeJwtPayload = (tokenValue: string): { exp?: number } | null => {
    try {
      const parts = tokenValue.split('.');
      if (parts.length !== 3) return null;

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const json = atob(base64 + padding);

      return JSON.parse(json);
    } catch {
      return null;
    }
  };
  
  // Read token from cookie - improved parsing
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  };
  
  const token = getCookie('auth-token');
  const userDataStr = getCookie('user-data');
  
  if (token && userDataStr) {
    try {
      const payload = decodeJwtPayload(token);
      if (payload) {
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          setLoading(false);
          return;
        }

        setToken(token);
        const userData = JSON.parse(userDataStr);
        setUser(userData);
        setDbUser(userData);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('Auth initialization failed:', e);
    }
  }
  
  setLoading(false);
};
