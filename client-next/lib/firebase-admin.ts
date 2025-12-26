import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseAdminConfig, environment, useEmulator, emulatorHosts } from './firebase-config';

let app: App;
let adminAuth: Auth;
let adminDb: Firestore;

// Initialize Firebase Admin (only once)
if (getApps().length === 0) {
  const { projectId, clientEmail, privateKey } = firebaseAdminConfig;
  
  // Check if we have valid credentials
  if (projectId && clientEmail && privateKey) {
    try {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      console.log(`[FIREBASE_ADMIN] Initialized for ${environment} environment with project: ${projectId}`);
    } catch (err) {
      console.error('[FIREBASE_ADMIN] Failed to initialize with credentials:', err);
      // Fallback: try to initialize without explicit credentials (works in Google Cloud)
      app = initializeApp({ projectId });
    }
  } else {
    // Try environment variable fallback (JSON string)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      try {
        const parsedKey = JSON.parse(serviceAccountJson);
        app = initializeApp({
          credential: cert(parsedKey),
          projectId: parsedKey.project_id,
        });
        console.log(`[FIREBASE_ADMIN] Initialized from JSON env var for project: ${parsedKey.project_id}`);
      } catch (err) {
        console.error('[FIREBASE_ADMIN] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err);
        app = initializeApp();
      }
    } else {
      // No credentials - initialize with defaults (works in Google Cloud environments)
      console.warn('[FIREBASE_ADMIN] No credentials found, using default initialization');
      app = initializeApp();
    }
  }
  
  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
  
  // Connect to Firestore emulator in local environment if enabled
  if (environment === 'local' && useEmulator && emulatorHosts.firestore.host) {
    try {
      // Note: Firestore Admin SDK emulator connection is set via FIRESTORE_EMULATOR_HOST env var
      // This is automatically detected by the SDK if the env var is set
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.log(`[FIREBASE_ADMIN] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
      }
    } catch (err) {
      console.warn('[FIREBASE_ADMIN] Emulator connection warning:', err);
    }
  }
} else {
  app = getApps()[0];
  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
}

export { app, adminAuth, adminDb };

// Verify Firebase ID token and get user
export async function verifyToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { valid: true, uid: decodedToken.uid, email: decodedToken.email };
  } catch (error: any) {
    console.error('[FIREBASE_ADMIN] Token verification failed:', error.message);
    return { valid: false, uid: null, email: null };
  }
}

// Get user from Authorization header
export async function getUserFromRequest(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  const result = await verifyToken(token);
  
  if (!result.valid || !result.uid) {
    return null;
  }
  
  return { uid: result.uid, email: result.email };
}
