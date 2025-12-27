// Firebase Auth utility functions
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { auth } from './firebase';
import { getUserProfile, createUserProfile } from './api';
import { environment, firebaseConfig, apiBaseUrl } from './firebase-config';

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get the ID token immediately and store it so API calls can use it
    const idToken = await user.getIdToken();
    if (idToken) {
      // Store it temporarily so getAuthHeaders() can use it
      localStorage.setItem('jwt', idToken);
    }
    
    // Create user profile in Firestore
    await createUserProfile({
      id: user.uid,
      email: user.email || email,
      name: name,
      onboarding_complete: false
    });
    
    return {
      success: true,
      user,
      error: null
    };
  } catch (error: any) {
    console.error('[FIREBASE_AUTH] Sign up error:', error);
    return {
      success: false,
      user: null,
      error: getAuthErrorMessage(error)
    };
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Exchange for app JWT token
    await exchangeFirebaseTokenForJWT(user);
    
    return {
      success: true,
      user,
      error: null
    };
  } catch (error: any) {
    console.error('[FIREBASE_AUTH] Sign in error:', error);
    return {
      success: false,
      user: null,
      error: getAuthErrorMessage(error)
    };
  }
};

// Sign in with Google
export const signInWithGoogle = async (idToken: string) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;
    
    // Get or create user profile
    const { success, data: profile } = await getUserProfile(user.uid);
    if (!success || !profile) {
      await createUserProfile({
        id: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'User',
        onboarding_complete: false
      });
    }
    
    // Exchange for app JWT token
    await exchangeFirebaseTokenForJWT(user);
    
    return {
      success: true,
      user,
      error: null
    };
  } catch (error: any) {
    console.error('[FIREBASE_AUTH] Google sign in error:', error);
    return {
      success: false,
      user: null,
      error: getAuthErrorMessage(error)
    };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('jwt');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('[FIREBASE_AUTH] Sign out error:', error);
    return {
      success: false,
      error: getAuthErrorMessage(error)
    };
  }
};

// Get current user
export const getCurrentAuthUser = (): User | null => {
  return auth.currentUser;
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Exchange Firebase ID token for app JWT
const exchangeFirebaseTokenForJWT = async (firebaseUser: User) => {
  try {
    const idToken = await firebaseUser.getIdToken();
    const email = firebaseUser.email || '';
    const name = firebaseUser.displayName || '';
    
    // Try Next API first, then fallback to backend directly
    const primary = '/api/auth/exchange';
    const backendBase = apiBaseUrl.replace(/\/$/, '');
    const fallback = `${backendBase}/api/auth/exchange`;
    
    let res = await fetch(primary, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ 
        email, 
        name,
        firebaseToken: idToken 
      })
    });
    
    if (!res.ok) {
      res = await fetch(fallback, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          email, 
          name,
          firebaseToken: idToken 
        })
      });
    }
    
    if (res.ok) {
      const json = await res.json();
      if (json?.token) {
        localStorage.setItem('jwt', json.token);
      }
    }
  } catch (error) {
    console.warn('[FIREBASE_AUTH] JWT exchange failed:', error);
  }
};

// Get user-friendly error messages
const getAuthErrorMessage = (error: AuthError | any): string => {
  if (!error.code) {
    return error.message || 'An unexpected error occurred';
  }
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
};

// Test Firebase connection
export const testFirebaseReachability = async (): Promise<{ reachable: boolean; error?: string }> => {
  // DEVELOPMENT MODE: Return reachable if bypassing auth
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' && environment === 'local') {
    return { reachable: true };
  }

  try {
    // Check if Firebase is properly configured
    if (!auth) {
      return { reachable: false, error: 'Firebase Auth is not initialized' };
    }
    
    // In local mode, assume it's reachable (or check emulator)
    if (environment === 'local') {
      return { reachable: true };
    }
    
    // For production, we can't test without making an actual auth call
    // Just verify config is present
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      return { reachable: false, error: 'Firebase configuration is incomplete' };
    }
    
    return { reachable: true };
  } catch (err: any) {
    return { reachable: false, error: err.message || 'Unknown connection error' };
  }
};

