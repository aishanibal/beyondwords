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
import { getUserProfile, createUserProfile } from '../lib/api';
import { getCurrentAuthUser, onAuthStateChange, signOutUser } from '../lib/firebase-auth';
import { getIdToken } from '../lib/firebase';

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

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          const { success, data: profile } = await getUserProfile(firebaseUser.uid);
          
          if (success && profile) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: profile.name || firebaseUser.displayName || '',
              photoUrl: firebaseUser.photoURL || profile.photoUrl,
              onboarding_complete: profile.onboarding_complete,
              ...profile
            });
            syncWithUserPreferences(profile);
          } else {
            // Create new profile if it doesn't exist
            const newProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              onboarding_complete: false
            };
            
            const { success: createSuccess, data: createdProfile } = await createUserProfile(newProfile);
            if (createSuccess && createdProfile) {
              setUser({
                id: createdProfile.id,
                email: createdProfile.email,
                name: createdProfile.name,
                photoUrl: firebaseUser.photoURL,
                onboarding_complete: createdProfile.onboarding_complete || false,
                ...createdProfile
              });
            } else {
              console.error('[AUTH] Failed to create user profile');
              setUser(null);
            }
          }

          // Store Firebase token for API calls
          try {
            const idToken = await getIdToken();
            if (idToken) {
              localStorage.setItem('jwt', idToken);
            }
          } catch (e) {
            console.warn('[AUTH] Failed to get Firebase token', e);
          }
        } else {
          // User is signed out
          console.log('[AUTH] User signed out');
          setUser(null);
          localStorage.removeItem('jwt');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('[AUTH] Error in auth state change handler:', err);
        setIsLoading(false);
      }
    });

    // Check initial auth state
    const currentUser = getCurrentAuthUser();
    if (!currentUser) {
      setUser(null);
      setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [syncWithUserPreferences]);

  const logout = async () => {
    // DEVELOPMENT MODE: Skip Firebase signout if bypassing
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development') {
      setUser(null);
      localStorage.removeItem('jwt');
      router.push('/');
      return;
    }

    try {
      await signOutUser();
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

  // Memoize only the user properties needed for routing to prevent infinite loops
  const userRoutingState = useMemo(() => ({
    exists: !!user,
    onboardingComplete: user?.onboarding_complete
  }), [user?.onboarding_complete, !!user]);

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;
    let isCancelled = false;

    const handleRedirect = () => {
      if (isCancelled) return;

      console.log('[ROUTING] State:', { 
        isLoading, 
        userExists: userRoutingState.exists, 
        onboardingComplete: userRoutingState.onboardingComplete,
        pathname 
      });

      if (!userRoutingState.exists) {
        if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
          console.log('[ROUTING] No user, redirecting to login');
          router.replace('/login');
        }
      } else if (userRoutingState.exists && !isLoading) {
        if (userRoutingState.onboardingComplete === false && pathname !== '/onboarding') {
          console.log('[ROUTING] User needs onboarding, redirecting from', pathname);
          router.replace('/onboarding');
        } else if (userRoutingState.onboardingComplete && (pathname === '/onboarding' || pathname === '/login' || pathname === '/signup')) {
          console.log('[ROUTING] User completed onboarding, redirecting to dashboard');
          router.replace('/dashboard');
        }
      }
    };

    // Add a small delay to let signup navigation complete first
    const routingTimeout = setTimeout(handleRedirect, 200);

    return () => {
      isCancelled = true;
      clearTimeout(routingTimeout);
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [isLoading, userRoutingState.exists, userRoutingState.onboardingComplete, pathname, router]);

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