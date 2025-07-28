/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';
import Navigation from "./components/Navigation";

const translucentBg = 'rgba(60,76,115,0.06)';
const translucentRose = 'rgba(195,141,148,0.08)';

interface User {
  id?: string;
  role?: string;
  onboarding_complete?: boolean | number;
  photoUrl?: string;
  [key: string]: any;
}
interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
}
const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  return useContext(UserContext) as UserContextType;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    if (token) {
      axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res: any) => {
          clearTimeout(fallbackTimeout);
          setUser(res.data.user);
          console.log('APP setUser called:', res.data.user);
        })
        .catch(() => {
          clearTimeout(fallbackTimeout);
          if (typeof window !== 'undefined') localStorage.removeItem('jwt');
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      clearTimeout(fallbackTimeout);
      setIsLoading(false);
    }
    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const logout = async () => {
    if (typeof window !== 'undefined') localStorage.removeItem('jwt');
    setUser(null);
    window.location.href = '/';
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f1ec',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗝️</div>
        <div style={{ fontSize: '1.5rem', color: '#7e5a75', fontWeight: 600 }}>BeyondWords</div>
        <div style={{ fontSize: '0.9rem', color: '#7e5a75', opacity: 0.7 }}>Loading your experience...</div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'dummy-client-id'}>
      <UserContext.Provider value={{ user, setUser, logout }}>
        <Navigation />
        {children}
      </UserContext.Provider>
    </GoogleOAuthProvider>
  );
} 