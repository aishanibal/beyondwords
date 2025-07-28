/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../ClientLayout';
import logo from '../../assets/logo.png';

const floatKeyframes = `
@keyframes floatButton {
  0% { transform: translateY(0); box-shadow: 0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15); }
  50% { transform: translateY(-12px); box-shadow: 0 0 32px 8px #eec1d1, 0 8px 32px rgba(60,76,115,0.18); }
  100% { transform: translateY(0); box-shadow: 0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15); }
}`;

export default function SignupFloating() {
  const router = useRouter();
  const { user } = useUser ? useUser() : { user: null };
  if (user) return null;
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
          background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
          color: '#fff',
          borderRadius: 999,
          padding: '1rem 2rem',
          border: 'none',
          fontSize: 18,
          fontWeight: 600,
          cursor: 'pointer',
          animation: 'floatButton 2.5s ease-in-out infinite',
          boxShadow: '0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15)',
          outline: 'none',
        }}
        aria-label="Sign up for BeyondWords"
      >
        Register Now!
      </button>
    </>
  );
} 