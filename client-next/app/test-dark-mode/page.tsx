'use client';
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function TestDarkMode() {
  const { isDarkMode, theme } = useDarkMode();
  const [systemPreference, setSystemPreference] = useState<string>('Loading...');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSystemPreference(isDark ? 'Dark' : 'Light');
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-cream text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className={`text-4xl font-bold mb-8 ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'}`}>
          Dark Mode Test Page
        </h1>
        
        <div className={`rounded-lg shadow-lg p-6 mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'}`}>
            Current Theme Status
          </h2>
          
          <div className="space-y-2">
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>Theme Mode:</strong> {theme}
            </p>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>Is Dark Mode:</strong> {isDarkMode ? 'Yes' : 'No'}
            </p>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>System Preference:</strong> {systemPreference}
            </p>
          </div>
        </div>

        <div className={`rounded-lg shadow-lg p-6 mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'}`}>
            Theme Toggle
          </h2>
          
          <ThemeToggle showLabel={true} />
        </div>

        <div className={`rounded-lg shadow-lg p-6 mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'}`}>
            Sample Content
          </h2>
          
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            This is a test page to verify that the dark mode implementation is working correctly.
            You should see smooth transitions when switching between themes.
          </p>
          
          <div className="space-y-4">
            <button className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-light-purple text-white hover:bg-purple-600' 
                : 'bg-rose-primary text-white hover:bg-rose-primary/90'
            }`}>
              Primary Button
            </button>
            
            <button className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-rose-accent/30 text-gray-700 hover:bg-rose-accent/10'
            }`}>
              Secondary Button
            </button>
          </div>
        </div>

        <div className={`rounded-lg shadow-lg p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-2xl font-semibold mb-4 ${isDarkMode ? 'text-light-purple' : 'text-rose-primary'}`}>
            Form Elements
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sample Input
              </label>
              <input
                type="text"
                placeholder="Enter some text..."
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-rose-accent/30 text-gray-700 placeholder-gray-500'
                }`}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sample Select
              </label>
              <select className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-rose-accent/30 text-gray-700'
              }`}>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 