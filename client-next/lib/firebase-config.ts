// Firebase configuration for local and production environments

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface EnvironmentConfig {
  firebase: FirebaseConfig;
  firebaseAdmin: FirebaseAdminConfig;
  apiBaseUrl: string;
  aiBackendUrl: string;
  useEmulator: boolean;
  emulatorHosts: {
    auth: string;
    firestore: { host: string; port: number };
  };
}

// Local environment configuration
const localConfig: EnvironmentConfig = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_LOCAL || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_LOCAL || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_LOCAL || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_LOCAL || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_LOCAL || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_LOCAL || '',
  },
  firebaseAdmin: {
    projectId: process.env.FIREBASE_PROJECT_ID_LOCAL || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_LOCAL || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL_LOCAL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY_LOCAL || '').replace(/\\n/g, '\n'),
  },
  apiBaseUrl: 'http://localhost:3000', // Next.js API routes
  aiBackendUrl: 'http://localhost:5000', // Python API
  useEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
  emulatorHosts: {
    auth: 'http://localhost:9099',
    firestore: { host: 'localhost', port: 8080 },
  },
};

// Production environment configuration
const productionConfig: EnvironmentConfig = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PROD || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_PROD || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_PROD || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PROD || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_PROD || '',
  },
  firebaseAdmin: {
    projectId: process.env.FIREBASE_PROJECT_ID_PROD || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PROD || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL_PROD || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY_PROD || '').replace(/\\n/g, '\n'),
  },
  apiBaseUrl: 'https://beyondwords-client.vercel.app', // Production Next.js
  aiBackendUrl: 'https://beyondwords.onrender.com', // Production Python API
  useEmulator: false,
  emulatorHosts: {
    auth: '',
    firestore: { host: '', port: 0 },
  },
};

// Determine which environment we're in based on environment variable
const getEnvironment = (): 'local' | 'production' => {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV;
  if (env === 'production' || env === 'prod') {
    return 'production';
  }
  return 'local';
};

// Export the appropriate configuration based on environment
export const environment = getEnvironment();
export const config: EnvironmentConfig = environment === 'production' ? productionConfig : localConfig;

// Export individual config values for convenience
export const firebaseConfig = config.firebase;
export const firebaseAdminConfig = config.firebaseAdmin;
export const apiBaseUrl = config.apiBaseUrl;
export const aiBackendUrl = config.aiBackendUrl;
export const useEmulator = config.useEmulator;
export const emulatorHosts = config.emulatorHosts;
