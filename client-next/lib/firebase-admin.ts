import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseAdminConfig, firebaseConfig, environment, useEmulator, emulatorHosts } from './firebase-config';

let app: App;
let adminAuth: Auth;
let adminDb: Firestore;

// Get the project ID - use admin config first, fallback to client config
// This ensures Admin SDK uses the same project as the client SDK
const getProjectId = () => {
  return firebaseAdminConfig.projectId || firebaseConfig.projectId || 'demo-project';
};

// IMPORTANT: Set emulator environment variables BEFORE initializing Firebase Admin
// The Admin SDK reads these during initialization
if (environment === 'local' && useEmulator) {
  // Set Firestore emulator host
  if (!process.env.FIRESTORE_EMULATOR_HOST && emulatorHosts.firestore.host) {
    process.env.FIRESTORE_EMULATOR_HOST = `${emulatorHosts.firestore.host}:${emulatorHosts.firestore.port}`;
  }
  
  // Set Auth emulator host (remove http:// prefix)
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST && emulatorHosts.auth) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = emulatorHosts.auth.replace('http://', '');
  }
  
  console.log(`[FIREBASE_ADMIN] Emulator mode enabled:`);
  console.log(`  - Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`  - Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
}

// Initialize Firebase Admin (only once)
if (getApps().length === 0) {
  const { projectId, clientEmail, privateKey } = firebaseAdminConfig;
  const resolvedProjectId = getProjectId();
  
  // For emulator mode, we can initialize with just projectId (no credentials needed)
  if (environment === 'local' && useEmulator) {
    app = initializeApp({ projectId: resolvedProjectId });
    console.log(`[FIREBASE_ADMIN] Initialized for emulator with project: ${resolvedProjectId}`);
  }
  // Check if we have valid credentials for non-emulator mode
  else if (projectId && clientEmail && privateKey) {
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
} else {
  app = getApps()[0];
  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
}

export { app, adminAuth, adminDb };

// Verify Firebase ID token and get user
export async function verifyToken(token: string) {
  try {
    console.log('[FIREBASE_ADMIN] Verifying token, length:', token?.length);
    console.log('[FIREBASE_ADMIN] Token prefix:', token?.substring(0, 20) + '...');
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('[FIREBASE_ADMIN] Token verified successfully, uid:', decodedToken.uid);
    return { valid: true, uid: decodedToken.uid, email: decodedToken.email };
  } catch (error: any) {
    console.error('[FIREBASE_ADMIN] Token verification failed:', error.message);
    console.error('[FIREBASE_ADMIN] Error code:', error.code);
    console.error('[FIREBASE_ADMIN] Full error:', error);
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
