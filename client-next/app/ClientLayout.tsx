/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
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
import { getUserProfile, createUserProfile } from '../lib/supabase';

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
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false');
      setIsLoading(false);
    }, 10000); // 10 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Found existing session:', session.user);
          // Get user profile from our database
          const { success, data: profile, error: profileError } = await getUserProfile(session.user.id);
          console.log('getUserProfile result:', { success, profile, profileError });
          
          if (success && profile) {
            const userData = {
              id: session.user.id,
              email: session.user.email,
              name: profile.name || session.user.user_metadata?.full_name,
              photoUrl: session.user.user_metadata?.picture,
              onboarding_complete: profile.onboarding_complete,
              ...profile
            };
            console.log('Setting user with profile:', userData);
            setUser(userData);
            
            // Sync theme with user preferences
            if (profile.preferences?.theme) {
              syncWithUserPreferences(profile.preferences.theme);
            }
          } else {
            // Create user profile if it doesn't exist
            const userData = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              google_id: session.user.user_metadata?.sub
            };
            
            console.log('Creating user profile:', userData);
            const { success: createSuccess, error: createError } = await createUserProfile(userData);
            console.log('createUserProfile result:', { createSuccess, createError });
            
            if (createSuccess) {
              setUser({
                id: session.user.id,
                email: session.user.email,
                name: userData.name,
                photoUrl: session.user.user_metadata?.picture,
                onboarding_complete: false
              });
            } else {
              // Set basic user data even if profile creation fails
              console.log('Profile creation failed, setting basic user data');
              setUser({
                id: session.user.id,
                email: session.user.email,
                name: userData.name,
                photoUrl: session.user.user_metadata?.picture,
                onboarding_complete: false
              });
            }
          }
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Get or create user profile
            const { success, data: profile, error } = await getUserProfile(session.user.id);
            console.log('getUserProfile result:', { success, profile, error });
            
            if (success && profile) {
              const userData = {
                id: session.user.id,
                email: session.user.email,
                name: profile.name || session.user.user_metadata?.full_name,
                photoUrl: session.user.user_metadata?.picture,
                onboarding_complete: profile.onboarding_complete,
                ...profile
              };
              console.log('Setting user with profile:', userData);
              setUser(userData);
            } else {
              // Create new user profile
              const userData = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                google_id: session.user.user_metadata?.sub
              };
              
              console.log('Creating new user profile:', userData);
              const { success: createSuccess, error: createError } = await createUserProfile(userData);
              console.log('createUserProfile result:', { createSuccess, createError });
              
              if (createSuccess) {
                const newUser = {
                  id: session.user.id,
                  email: session.user.email,
                  name: userData.name,
                  photoUrl: session.user.user_metadata?.picture,
                  onboarding_complete: false
                };
                console.log('Setting new user:', newUser);
                setUser(newUser);
              } else {
                // Even if profile creation fails, set basic user data to prevent loading state
                console.log('Profile creation failed, setting basic user data');
                setUser({
                  id: session.user.id,
                  email: session.user.email,
                  name: userData.name,
                  photoUrl: session.user.user_metadata?.picture,
                  onboarding_complete: false
                });
              }
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
            // Set basic user data even if there's an error
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              photoUrl: session.user.user_metadata?.picture,
              onboarding_complete: false
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
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
    if (!isLoading && user === null) {
      // User is not authenticated, redirect to login
      if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
        router.push('/login');
      }
    } else if (!isLoading && user) {
      // User is authenticated, check if they need onboarding
      if (user.onboarding_complete === false) {
        // If onboarding is not complete, redirect to onboarding immediately
        if (pathname !== '/onboarding') {
          router.push('/onboarding');
        }
      } else {
        // If onboarding is complete, redirect away from onboarding/login/signup
        if (pathname === '/onboarding' || pathname === '/login' || pathname === '/signup') {
          router.push('/dashboard');
        }
      }
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

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