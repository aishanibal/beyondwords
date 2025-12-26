import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig, environment, useEmulator, emulatorHosts } from './firebase-config';

// Initialize Firebase app (only once)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Check if Firebase is already initialized
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Connect to emulators in local development (only in browser)
  if (environment === 'local' && useEmulator && typeof window !== 'undefined') {
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

export { app, auth, db };

// Auth helper functions
export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
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
    // Try to get auth instance (will throw if not configured)
    if (!auth) {
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
