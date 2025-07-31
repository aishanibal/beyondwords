'use client';
import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, isDarkMode } = useDarkMode();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-rose-accent'}`}>
          Theme:
        </span>
      )}
      
      <select
        value={theme}
        onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'auto')}
        className={`px-3 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-white border-rose-accent/30 text-gray-700'
        }`}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="auto">Auto</option>
      </select>
    </div>
  );
} 