'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'thumbtrack_session';
const REMEMBER_ME_KEY = 'thumbtrack_remember_me';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  };

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = api.getToken();
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
      const sessionData = localStorage.getItem(SESSION_KEY);

      if (token) {
        try {
          // Validate token with backend
          const { user } = await api.getMe();
          setUser(user);

          // Update session timestamp
          localStorage.setItem(SESSION_KEY, JSON.stringify({
            lastActivity: Date.now(),
            rememberMe,
          }));
        } catch {
          console.log('Session expired or invalid, logging out');
          handleLogout();
        }
      } else if (sessionData) {
        // Session data exists but no token - clear it
        localStorage.removeItem(SESSION_KEY);
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Check for session expiration every minute
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const sessionData = localStorage.getItem(SESSION_KEY);
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

      if (sessionData) {
        const { lastActivity } = JSON.parse(sessionData);
        const now = Date.now();
        const maxInactivity = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7 days or 1 day

        if (now - lastActivity > maxInactivity) {
          console.log('Session expired due to inactivity');
          handleLogout();
        }
      }
    };

    const interval = setInterval(checkSession, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  // Update activity timestamp on user interaction
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const { rememberMe } = JSON.parse(sessionData);
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          lastActivity: Date.now(),
          rememberMe,
        }));
      }
    };

    // Update activity on mouse/keyboard events
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [user]);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    const { user } = await api.login(email, password);
    setUser(user);

    // Store session info
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      lastActivity: Date.now(),
      rememberMe,
    }));
  };

  const register = async (email: string, username: string, password: string) => {
    const { user } = await api.register(email, username, password);
    setUser(user);

    // Store session info (default to remember me)
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      lastActivity: Date.now(),
      rememberMe: true,
    }));
  };

  const refreshUser = async () => {
    try {
      const { user } = await api.getMe();
      setUser(user);
    } catch {
      handleLogout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout: handleLogout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
