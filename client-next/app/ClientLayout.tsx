/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState, createContext, useContext } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';
import Navigation from "./components/Navigation";
import SignupFloating from "./components/SignupFloating";
import LoadingScreen from "./components/LoadingScreen";
import { useDarkMode } from './contexts/DarkModeContext';
import { supabase } from '../lib/supabase';
import { getUserProfile, createUserProfile, testSupabaseConnection, getCurrentSession } from '../lib/supabase';

// Debug Supabase client configuration
console.log('[SUPABASE_DEBUG] Client imported successfully');
console.log('[SUPABASE_DEBUG] Environment check:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
});

const translucentBg = 'rgba(60,76,115,0.06)';
const translucentRose = 'rgba(195,141,148,0.08)';

interface User {
  id?: string;
  role?: string;
  onboarding_complete?: boolean | number;
  photoUrl?: string;
  email?: string;
  name?: string;
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
    console.log('[EFFECT] Starting authentication flow');
    
    const initAuth = async () => {
      try {
        // Get current session with enhanced session management
        const { session, error } = await getCurrentSession();
        
        if (error) {
          console.error('[AUTH] Session error:', error);
          setIsLoading(false);
          return;
        }

        // Set up auth state change listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('[AUTH] State change:', event, newSession?.user?.id);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
              if (!newSession?.user) return;
              
              try {
                const { success, data: profile } = await getUserProfile(newSession.user.id);
                
                if (success && profile) {
                  setUser({
                    id: newSession.user.id,
                    email: newSession.user.email,
                    name: profile.name || newSession.user.user_metadata?.full_name,
                    photoUrl: newSession.user.user_metadata?.picture,
                    onboarding_complete: profile.onboarding_complete,
                    ...profile
                  });
                  syncWithUserPreferences(profile);
                } else {
                  // Create new profile
                  const newProfile = {
                    id: newSession.user.id,
                    email: newSession.user.email || '',
                    name: newSession.user.user_metadata?.full_name || newSession.user.email?.split('@')[0] || 'User',
                    google_id: newSession.user.user_metadata?.sub,
                    onboarding_complete: false
                  };
                  
                  const { success: createSuccess } = await createUserProfile(newProfile);
                  if (createSuccess) {
                    setUser(newProfile);
                  } else {
                    console.error('[AUTH] Failed to create user profile');
                    setUser(null);
                  }
                }
              } catch (err) {
                console.error('[AUTH] Profile error:', err);
                setUser(null);
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('[AUTH] User signed out');
              setUser(null);
              localStorage.removeItem('supabase.auth.token');
            }
            
            setIsLoading(false);
          }
        );

        // Handle initial session
        if (session?.user) {
          const { success, data: profile } = await getUserProfile(session.user.id);
          if (success && profile) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: profile.name || session.user.user_metadata?.full_name,
              photoUrl: session.user.user_metadata?.picture,
              onboarding_complete: profile.onboarding_complete,
              ...profile
            });
            syncWithUserPreferences(profile);
          }
        }

        return () => {
          subscription.unsubscribe();
          console.log('[AUTH] Cleanup: unsubscribed from auth changes');
        };
      } catch (err) {
        console.error('[AUTH] Init error:', err);
        setIsLoading(false);
      }
    };

    initAuth();
  }, [syncWithUserPreferences]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing');
  }

  // Handle routing after authentication
  useEffect(() => {
    console.log('[ROUTING] Routing effect triggered:', { isLoading, user, pathname });
    console.log('[ROUTING] User details:', user ? {
      id: user.id,
      email: user.email,
      onboarding_complete: user.onboarding_complete
    } : 'No user');
    
    if (user === null) {
      console.log('[ROUTING] User not authenticated, redirecting to login immediately');
      // User is not authenticated, redirect to login immediately
      if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
        router.push('/login');
      }
    } else if (user && isLoading) {
      console.log('[ROUTING] User authenticated but still loading profile data, waiting...');
      // User is authenticated but we're still loading their profile data
    } else if (user && !isLoading) {
      console.log('[ROUTING] User authenticated and profile loaded:', { onboarding_complete: user.onboarding_complete, pathname });
      // User is authenticated and profile is loaded, check if they need onboarding
      if (user.onboarding_complete === false) {
        // If onboarding is not complete, redirect to onboarding immediately
        if (pathname !== '/onboarding') {
          console.log('[ROUTING] Redirecting to onboarding');
          router.push('/onboarding');
        }
      } else {
        // If onboarding is complete, redirect away from onboarding/login/signup
        if (pathname === '/onboarding' || pathname === '/login' || pathname === '/signup') {
          console.log('[ROUTING] Redirecting to dashboard');
          router.push('/dashboard');
        }
      }
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading && user) {
    console.log('[LOADING] Showing loading screen for authenticated user:', user);
    return <LoadingScreen />;
  }

  // If not loading or no user, show the app content
  console.log('[RENDER] Rendering app content, user:', user, 'isLoading:', isLoading);

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <SignupFloating />
        </div>
      </GoogleOAuthProvider>
    </UserContext.Provider>
  );
} 