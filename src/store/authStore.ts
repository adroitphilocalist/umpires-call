'use client';

import { create } from 'zustand';
import { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  dbUser: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setDbUser: (dbUser: any | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  dbUser: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  setDbUser: (dbUser) => set({ dbUser }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, dbUser: null, isAuthenticated: false }),
}));