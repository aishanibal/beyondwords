/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState, createContext, useContext, useMemo } from 'react';
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
    // DEVELOPMENT MODE: Bypass authentication if enabled
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [DEV MODE] Authentication bypassed - DO NOT USE IN PRODUCTION');
      // Create a mock user for development
      const mockUser: User = {
        id: 'dev-user-123',
        email: 'dev@localhost.test',
        name: 'Development User',
        onboarding_complete: true
      };
      setUser(mockUser);
      setIsLoading(false);
      return;
    }

    // console.log('[EFFECT] Starting authentication flow');
    
    // Store subscription reference for cleanup
    let subscription: { unsubscribe: () => void } | null = null;
    
    const initAuth = async () => {
      try {
        // Get current session with enhanced session management
        const { session, error } = await getCurrentSession();
        
        if (error) {
          console.error('[AUTH] Session error:', error);
          setIsLoading(false);
          return;
        }

        // DEVELOPMENT MODE: Skip auth state listener if bypassing
        if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development') {
          setIsLoading(false);
          return;
        }

        // Set up auth state change listener first
        // Wrap async handler to prevent message channel errors
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            // Use setTimeout to make this truly async and prevent message channel errors
            setTimeout(async () => {
              try {
                // console.log('[AUTH] State change:', event, newSession?.user?.id);
                
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                  if (!newSession?.user) {
                    setIsLoading(false);
                    return;
                  }
                  
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
                      
                      const { success: createSuccess, data: createdProfile } = await createUserProfile(newProfile);
                      if (createSuccess && createdProfile) {
                        setUser({
                          id: createdProfile.id,
                          email: createdProfile.email,
                          name: createdProfile.name,
                          photoUrl: newSession.user.user_metadata?.picture,
                          onboarding_complete: createdProfile.onboarding_complete || false,
                          ...createdProfile
                        });
                      } else {
                        console.error('[AUTH] Failed to create user profile');
                        setUser(null);
                      }
                    }

                    // Ensure our app JWT is available for backend calls
                    try {
                      const email = newSession.user.email || '';
                      const name = newSession.user.user_metadata?.full_name || newSession.user.user_metadata?.name || '';
                      // Try Next API first, then fallback to backend directly
                      const primary = '/api/auth/exchange';
                      const backendBase = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beyondwords-express.onrender.com').replace(/\/$/, '');
                      const fallback = `${backendBase}/api/auth/exchange`;
                      let res = await fetch(primary, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, name })
                      });
                      if (!res.ok) {
                        res = await fetch(fallback, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, name })
                        });
                      }
                      if (res.ok) {
                        const json = await res.json();
                        if (json?.token) {
                          localStorage.setItem('jwt', json.token);
                        }
                      }
                    } catch (e) {
                      console.warn('[AUTH] JWT exchange failed', e);
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
              } catch (err) {
                console.error('[AUTH] Error in auth state change handler:', err);
                setIsLoading(false);
              }
            }, 0);
          }
        );
        
        subscription = authSubscription;

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
        } else {
          // No initial session, user is not logged in
          console.log('[AUTH] No initial session found');
          setUser(null);
        }
        
        // Always set loading to false after handling initial session
        setIsLoading(false);
      } catch (err) {
        console.error('[AUTH] Init error:', err);
        setIsLoading(false);
      }
    };

    initAuth();
    
    // Cleanup function - properly unsubscribe when component unmounts
    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
          // console.log('[AUTH] Cleanup: unsubscribed from auth changes');
        } catch (err) {
          console.warn('[AUTH] Error unsubscribing:', err);
        }
      }
    };
  }, [syncWithUserPreferences]);

  const logout = async () => {
    // DEVELOPMENT MODE: Skip Supabase signout if bypassing
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development') {
      setUser(null);
      localStorage.removeItem('jwt');
      router.push('/');
      return;
    }

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
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Memoize only the user properties needed for routing to prevent infinite loops
  const userRoutingState = useMemo(() => ({
    exists: !!user,
    onboardingComplete: user?.onboarding_complete
  }), [user?.onboarding_complete, !!user]);

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;

    const handleRedirect = () => {
      if (isRedirecting) return; // Prevent multiple redirects

      console.log('[ROUTING] State:', { 
        isLoading, 
        userExists: userRoutingState.exists, 
        onboardingComplete: userRoutingState.onboardingComplete,
        pathname 
      });

      if (!userRoutingState.exists) {
        if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
          console.log('[ROUTING] No user, redirecting to login');
          setIsRedirecting(true);
          redirectTimeout = setTimeout(() => {
            router.replace('/login');
          }, 100);
        }
      } else if (userRoutingState.exists && !isLoading) {
        if (userRoutingState.onboardingComplete === false && pathname !== '/onboarding') {
          console.log('[ROUTING] User needs onboarding, redirecting from', pathname);
          setIsRedirecting(true);
          redirectTimeout = setTimeout(() => {
            router.replace('/onboarding');
          }, 100);
        } else if (userRoutingState.onboardingComplete && (pathname === '/onboarding' || pathname === '/login' || pathname === '/signup')) {
          console.log('[ROUTING] User completed onboarding, redirecting to dashboard');
          setIsRedirecting(true);
          redirectTimeout = setTimeout(() => {
            router.replace('/dashboard');
          }, 100);
        }
      }
    };

    // Add a small delay to let signup navigation complete first
    const routingTimeout = setTimeout(handleRedirect, 200);

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      if (routingTimeout) {
        clearTimeout(routingTimeout);
      }
      setIsRedirecting(false);
    };
  }, [isLoading, userRoutingState.exists, userRoutingState.onboardingComplete, pathname, router, isRedirecting]);

  // Only show loading screen if we're still checking authentication
  if (isLoading) {
    console.log('[LOADING] Checking authentication, user:', !!user);
    return <LoadingScreen />;
  }

  // If not loading or no user, show the app content
  // console.log('[RENDER] Rendering app content, user:', user, 'isLoading:', isLoading);

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