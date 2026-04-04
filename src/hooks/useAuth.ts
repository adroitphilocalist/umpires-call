'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

const USER_KEY = 'umpires_call_user';

export function useAuth() {
  const { user, dbUser, isLoading, isAuthenticated, setUser, setDbUser, setLoading, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    if (!mounted) return;

    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setDbUser(parsed);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, [mounted, setUser, setDbUser, setLoading]);

  const login = useCallback(async (userData: any) => {
    // Save to localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
    setDbUser(userData);
  }, [setUser, setDbUser]);

  const handleLogout = useCallback(() => {
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