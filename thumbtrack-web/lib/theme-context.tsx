'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal';

interface ThemeContextType {
  mode: ThemeMode;
  accentColor: AccentColor;
  effectiveMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = 'thumbtrack_theme_mode';
const ACCENT_COLOR_KEY = 'thumbtrack_accent_color';

// Accent color configurations
export const accentColors: Record<AccentColor, { primary: string; hover: string; light: string }> = {
  red: { primary: '#ef4444', hover: '#dc2626', light: '#fef2f2' },
  blue: { primary: '#3b82f6', hover: '#2563eb', light: '#eff6ff' },
  green: { primary: '#22c55e', hover: '#16a34a', light: '#f0fdf4' },
  purple: { primary: '#a855f7', hover: '#9333ea', light: '#faf5ff' },
  orange: { primary: '#f97316', hover: '#ea580c', light: '#fff7ed' },
  pink: { primary: '#ec4899', hover: '#db2777', light: '#fdf2f8' },
  teal: { primary: '#14b8a6', hover: '#0d9488', light: '#f0fdfa' },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<AccentColor>('red');
  const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>('light');

  // Load saved preferences
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    const savedAccent = localStorage.getItem(ACCENT_COLOR_KEY) as AccentColor | null;

    if (savedMode) setModeState(savedMode);
    if (savedAccent) setAccentColorState(savedAccent);
  }, []);

  // Update effective mode based on system preference and user setting
  useEffect(() => {
    const updateEffectiveMode = () => {
      if (mode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEffectiveMode(isDark ? 'dark' : 'light');
      } else {
        setEffectiveMode(mode);
      }
    };

    updateEffectiveMode();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateEffectiveMode);
    return () => mediaQuery.removeEventListener('change', updateEffectiveMode);
  }, [mode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Update dark mode class
    if (effectiveMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update accent color CSS variables
    const colors = accentColors[accentColor];
    root.style.setProperty('--accent-primary', colors.primary);
    root.style.setProperty('--accent-hover', colors.hover);
    root.style.setProperty('--accent-light', colors.light);
  }, [effectiveMode, accentColor]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem(ACCENT_COLOR_KEY, color);
  };

  return (
    <ThemeContext.Provider value={{ mode, accentColor, effectiveMode, setMode, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
