import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig, environment, useEmulator, emulatorHosts } from './firebase-config';

// Lazy initialization - only initialize when needed (in browser)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Initialize Firebase lazily (only in browser, not during build)
function initializeFirebase() {
  // Skip initialization during SSR/build
  if (typeof window === 'undefined') {
    return;
  }

  // Already initialized
  if (app && auth && db) {
    return;
  }

  // Check if Firebase is already initialized by another import
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators in local development
    if (environment === 'local' && useEmulator) {
      try {
        if (emulatorHosts.auth) {
          connectAuthEmulator(auth, emulatorHosts.auth, { disableWarnings: true });
          console.log(`[FIREBASE] Connected to Auth emulator at ${emulatorHosts.auth}`);
        }
        if (emulatorHosts.firestore.host) {
          connectFirestoreEmulator(db, emulatorHosts.firestore.host, emulatorHosts.firestore.port);
          console.log(`[FIREBASE] Connected to Firestore emulator at ${emulatorHosts.firestore.host}:${emulatorHosts.firestore.port}`);
        }
      } catch (err) {
        // Emulators already connected or other error - ignore
        console.warn('[FIREBASE] Emulator connection warning:', err);
      }
    }
    
    console.log(`[FIREBASE] Initialized for ${environment} environment with project: ${firebaseConfig.projectId}`);
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

// Getter functions that ensure Firebase is initialized
export function getFirebaseApp(): FirebaseApp {
  initializeFirebase();
  if (!app) throw new Error('Firebase app not initialized');
  return app;
}

export function getFirebaseAuth(): Auth {
  initializeFirebase();
  if (!auth) throw new Error('Firebase auth not initialized');
  return auth;
}

export function getFirebaseDb(): Firestore {
  initializeFirebase();
  if (!db) throw new Error('Firebase db not initialized');
  return db;
}

// Legacy exports for backward compatibility (but use getters instead)
export { app, auth, db };

// Auth helper functions
export const getCurrentUser = () => {
  const firebaseAuth = getFirebaseAuth();
  return firebaseAuth.currentUser;
};

export const getIdToken = async (): Promise<string | null> => {
  const firebaseAuth = getFirebaseAuth();
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

// Note: User profile CRUD operations have been moved to API routes
// Import from lib/api.ts instead: getUserProfile, createUserProfile, updateUserProfile

// Test Firebase connection
export const testFirebaseConnection = async (): Promise<{ reachable: boolean; error?: string }> => {
  try {
    const firebaseAuth = getFirebaseAuth();
    
    // Try to get auth instance (will throw if not configured)
    if (!firebaseAuth) {
      return { reachable: false, error: 'Firebase Auth is not initialized' };
    }
    
    // In local mode with emulators, this will always work
    if (environment === 'local' && useEmulator) {
      return { reachable: true };
    }
    
    // For production, check if config values are present
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      return { reachable: false, error: 'Firebase configuration is incomplete' };
    }
    
    return { reachable: true };
  } catch (err: any) {
    return { reachable: false, error: err.message || 'Unknown connection error' };
  }
};
