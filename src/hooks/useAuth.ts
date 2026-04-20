'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, initializeAuth } from '@/store/authStore';

// No longer using localStorage for token - using cookies only
// Keep USER_KEY only for backwards compatibility if needed
const USER_KEY = 'umpires_call_user';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function useAuth() {
  const { user, dbUser, isLoading, isAuthenticated, setUser, setDbUser, setToken, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, []);

  const login = useCallback(async (userData: any, token: string) => {
    // Store user in localStorage (for initial load)
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    
    // Keep cookie TTL aligned with JWT expiry (7 days).
    document.cookie = `auth-token=${token}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Strict`;
    document.cookie = `user-data=${encodeURIComponent(JSON.stringify(userData))}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Strict`;
    
    // Update Zustand state
    setToken(token);
    setUser(userData);
    setDbUser(userData);
  }, [setToken, setUser, setDbUser]);

  const handleLogout = useCallback(() => {
    // Clear cookies
    document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Strict';
    document.cookie = 'user-data=; path=/; max-age=0; SameSite=Strict';
    localStorage.removeItem(USER_KEY);
    logout();
  }, [logout]);

  return { 
    user, 
    dbUser, 
    isLoading: isLoading || !mounted, 
    isAuthenticated, 
    login,
    logout: handleLogout 
  };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (!isLoading && !isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  return { isAuthenticated, isLoading };
}
