'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  syncWithUserPreferences: (userTheme?: 'light' | 'dark' | 'auto') => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');

  const applyTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    const shouldBeDark = newTheme === 'dark' || (newTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }, []);

  const handleDarkModeToggle = useCallback((dark: boolean) => {
    const newTheme = dark ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }, []);

  const syncWithUserPreferences = useCallback((userTheme?: 'light' | 'dark' | 'auto') => {
    if (userTheme) {
      setTheme(userTheme);
      localStorage.setItem('theme', userTheme);
      applyTheme(userTheme);
    }
  }, []);

  return (
    <DarkModeContext.Provider value={{
      isDarkMode,
      setIsDarkMode: handleDarkModeToggle,
      theme,
      setTheme: handleThemeChange,
      syncWithUserPreferences
    }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
} 