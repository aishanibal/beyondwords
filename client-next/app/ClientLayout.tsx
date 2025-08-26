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
import { getUserProfile, createUserProfile, testDatabaseConnection } from '../lib/supabase';

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
    console.log('[EFFECT] useEffect triggered, starting authentication flow');
    
    // Removed artificial loading timeout to avoid premature state changes

    // Get initial session
    const getInitialSession = async () => {
      console.log('[INIT] Starting getInitialSession');
      
      // Replace problematic database test with simple auth test
      console.log('[INIT] Testing Supabase auth connection...');
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        console.log('[INIT] Auth connection test result:', { hasAuthData: !!authData, authError });
      } catch (authErr) {
        console.error('[INIT] Auth connection test failed:', authErr);
      }
      
      try {
        console.log('[INIT] Calling supabase.auth.getSession()');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('[INIT] getSession result:', { session: !!session, error, userId: session?.user?.id });
        
        if (error) {
          console.error('[INIT] Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('[INIT] Found existing session:', session.user);
          // Get user profile from our database
          console.log('[INIT] Calling getUserProfile for user:', session.user.id);
          const { success, data: profile, error: profileError } = await getUserProfile(session.user.id);
          console.log('[INIT] getUserProfile result:', { success, profile, profileError });
          
          if (success && profile) {
            const userData = {
              id: session.user.id,
              email: session.user.email,
              name: profile.name || session.user.user_metadata?.full_name,
              photoUrl: session.user.user_metadata?.picture,
              onboarding_complete: profile.onboarding_complete,
              ...profile
            };
            console.log('[INIT] Setting user with profile:', userData);
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
            
            console.log('[INIT] Creating user profile:', userData);
            const { success: createSuccess, error: createError } = await createUserProfile(userData);
            console.log('[INIT] createUserProfile result:', { createSuccess, createError });
            
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
              console.log('[INIT] Profile creation failed, setting basic user data');
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
          console.log('[INIT] No existing session found');
        }
      } catch (error) {
        console.error('[INIT] Error in getInitialSession:', error);
      } finally {
        console.log('[INIT] getInitialSession completed, setting loading to false');
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    console.log('[EFFECT] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        console.log('Current user state:', user);
        console.log('Current loading state:', isLoading);
        
        // Only handle SIGNED_IN if we don't already have a user
        if (event === 'SIGNED_IN' && session?.user && !user) {
          console.log('Processing SIGNED_IN event for new user');
          
          // Debug Supabase configuration
          console.log('[AUTH] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
          console.log('[AUTH] Supabase client:', supabase);
          console.log('[AUTH] Session user ID:', session.user.id);
          console.log('[AUTH] Environment check:', {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
          });
          
          // Test Supabase connection first
          console.log('[AUTH] Testing Supabase connection...');
          try {
            console.log('[AUTH] About to call supabase.from("users").select("count").limit(1)');
            
            const connectionPromise = supabase
              .from('users')
              .select('count')
              .limit(1);
            
            const { data: testData, error: testError } = await connectionPromise;
            console.log('[AUTH] Supabase connection test result:', { testData, testError });
          } catch (testErr) {
            console.error('[AUTH] Supabase connection test failed:', testErr);
          }
          
          // Test database connection with our test function
          console.log('[AUTH] Running database connection test...');
          try {
            const dbTestResult = await testDatabaseConnection();
            console.log('[AUTH] Database test result:', dbTestResult);
          } catch (dbTestErr) {
            console.error('[AUTH] Database test failed:', dbTestErr);
          }
          
          // Test a simpler operation
          console.log('[AUTH] Testing simple Supabase operation...');
          try {
            console.log('[AUTH] About to call supabase.auth.getUser()');
            const { data: userData, error: userError } = await supabase.auth.getUser();
            console.log('[AUTH] getUser result:', { userData, userError });
          } catch (userErr) {
            console.error('[AUTH] getUser test failed:', userErr);
          }
          
          // Test a simple count query that should work
          console.log('[AUTH] Testing simple count query...');
          try {
            console.log('[AUTH] About to call supabase.from("users").select("*").limit(1)');
            const { data: countData, error: countError } = await supabase
              .from('users')
              .select('*')
              .limit(1);
            console.log('[AUTH] Count query result:', { countData, countError });
          } catch (countErr) {
            console.error('[AUTH] Count query failed:', countErr);
          }
          
          // Removed artificial timeouts around profile operations
          
          try {
            // Get or create user profile
            console.log('[AUTH] Calling getUserProfile for user:', session.user.id);
            const { success, data: profile, error } = await getUserProfile(session.user.id);
            console.log('[AUTH] getUserProfile result:', { success, profile, error });
            
            if (success && profile) {
              const userData = {
                id: session.user.id,
                email: session.user.email,
                name: profile.name || session.user.user_metadata?.full_name,
                photoUrl: session.user.user_metadata?.picture,
                onboarding_complete: profile.onboarding_complete,
                ...profile
              };
              console.log('[AUTH] Setting user with profile:', userData);
              setUser(userData);
              
              // Sync theme with user preferences
              if (profile.preferences?.theme) {
                syncWithUserPreferences(profile.preferences.theme);
              }
            } else {
              // Create new user profile
              const userData = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                google_id: session.user.user_metadata?.sub
              };
              
              console.log('[AUTH] Creating new user profile:', userData);
              const { success: createSuccess, error: createError } = await createUserProfile(userData);
              console.log('[AUTH] createUserProfile result:', { createSuccess, createError });
              
              if (createSuccess) {
                const newUser = {
                  id: session.user.id,
                  email: session.user.email,
                  name: userData.name,
                  photoUrl: session.user.user_metadata?.picture,
                  onboarding_complete: false
                };
                console.log('[AUTH] Setting new user:', newUser);
                setUser(newUser);
              } else {
                // Even if profile creation fails, set basic user data to prevent loading state
                console.log('[AUTH] Profile creation failed, setting basic user data');
                setUser({
                  id: session.user.id,
                  email: session.user.email,
                  name: userData.name,
                  photoUrl: session.user.user_metadata?.picture,
                  onboarding_complete: false
                });
              }
            }
            
            // Profile operations completed successfully
          } catch (error) {
            console.error('[AUTH] Error in auth state change handler:', error);
            
            // Set basic user data even if there's an error
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              photoUrl: session.user.user_metadata?.picture,
              onboarding_complete: false
            });
          }
        } else if (event === 'SIGNED_IN' && session?.user && user) {
          console.log('SIGNED_IN event but user already exists, skipping profile creation');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing user state');
          setUser(null);
        } else if (event === 'INITIAL_SESSION') {
          // This event fires when the initial session is loaded
          console.log('Initial session loaded');
        }
        
        // Always ensure loading is false after any auth state change
        console.log('Auth state change completed, ensuring loading is false');
        setIsLoading(false);
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
    console.log('[ROUTING] Routing effect triggered:', { isLoading, user, pathname });
    console.log('[ROUTING] User details:', user ? {
      id: user.id,
      email: user.email,
      onboarding_complete: user.onboarding_complete
    } : 'No user');
    
    if (!isLoading && user === null) {
      console.log('[ROUTING] User not authenticated, redirecting to login');
      // User is not authenticated, redirect to login
      if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
        router.push('/login');
      }
    } else if (!isLoading && user) {
      console.log('[ROUTING] User authenticated:', { onboarding_complete: user.onboarding_complete, pathname });
      // User is authenticated, check if they need onboarding
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
    } else if (isLoading) {
      console.log('[ROUTING] Still loading, not making routing decisions yet');
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