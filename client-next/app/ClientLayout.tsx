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
import SignupFloating from "./components/SignupFloating";
import LoadingScreen from "./components/LoadingScreen";
import { useDarkMode } from './contexts/DarkModeContext';

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
  const { syncWithUserPreferences } = useDarkMode();

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
          
          // Sync theme with user preferences
          if (res.data.user?.preferences?.theme) {
            syncWithUserPreferences(res.data.user.preferences.theme);
          }
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
  if (!googleClientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing');
  }

  // Handle routing after authentication
  useEffect(() => {
    if (!isLoading && user === null) {
      // User is not authenticated, redirect to login
      if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
        router.push('/login');
      }
    } else if (!isLoading && user) {
      // User is authenticated, check if they need onboarding
      if (!user.onboarding_complete) {
        // If onboarding is not complete, redirect to onboarding immediately
        if (pathname !== '/onboarding') {
          router.push('/onboarding');
        }
      } else {
        // Onboarding is complete, handle normal routing
        if (pathname === '/onboarding') {
          // Prevent access to onboarding if already completed
          router.push('/dashboard');
        } else if (pathname === '/login' || pathname === '/signup') {
          router.push('/dashboard');
        } else if (pathname === '/' && user.onboarding_complete) {
          router.push('/dashboard');
        }
      }
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return <LoadingScreen message="Loading your experience..." />;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'client-id-fake'}>
      <UserContext.Provider value={{ user, setUser, logout }}>
        <Navigation />
        {children}
        <SignupFloating />
      </UserContext.Provider>
    </GoogleOAuthProvider>
  );
} 