/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '../ClientLayout';
import { useDarkMode } from '../contexts/DarkModeContext';
import logo from '../../assets/logo.png';

const floatKeyframes = `
@keyframes floatButton {
  0% { transform: translateY(0); box-shadow: 0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15); }
  50% { transform: translateY(-12px); box-shadow: 0 0 32px 8px #eec1d1, 0 8px 32px rgba(60,76,115,0.18); }
  100% { transform: translateY(0); box-shadow: 0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15); }
}

@keyframes floatButtonDark {
  0% { transform: translateY(0); box-shadow: 0 0 16px 4px #c4b5fd, 0 4px 16px rgba(196,181,253,0.3); }
  50% { transform: translateY(-12px); box-shadow: 0 0 32px 8px #c4b5fd, 0 8px 32px rgba(196,181,253,0.4); }
  100% { transform: translateY(0); box-shadow: 0 0 16px 4px #c4b5fd, 0 4px 16px rgba(196,181,253,0.3); }
}`;

export default function SignupFloating() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useDarkMode();
  const { user } = useUser ? useUser() : { user: null };
  
  // Only show on landing page (root path) and not on signup page
  if (user || pathname !== '/') return null;
  return (
    <>
      <style>{floatKeyframes}</style>
      <button
        onClick={() => router.push('/signup')}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: isDarkMode ? 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)' : 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
          color: '#fff',
          borderRadius: 999,
          padding: '1rem 2rem',
          border: 'none',
          fontSize: 18,
          fontWeight: 600,
          cursor: 'pointer',
          animation: isDarkMode ? 'floatButtonDark 2.5s ease-in-out infinite' : 'floatButton 2.5s ease-in-out infinite',
          boxShadow: isDarkMode ? '0 0 16px 4px #c4b5fd, 0 4px 16px rgba(196,181,253,0.3)' : '0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15)',
          outline: 'none',
        }}
        aria-label="Sign up for BeyondWords"
      >
        Register Now!
      </button>
    </>
  );
} 