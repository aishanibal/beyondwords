/**
 * TTS Configuration for deployment
 * Handles URL construction for TTS files across different environments
 */

export const getTTSBaseUrl = (): string => {
  // Priority order for determining the backend URL:
  // 1. Environment variables (for explicit configuration)
  // 2. Runtime detection based on current domain
  // 3. Default fallback

  if (typeof window === 'undefined') {
    // Server-side fallback
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beyondwords-express.onrender.com';
  }

  // Client-side logic
  const envBackendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  
  // Debug logging for deployment troubleshooting
  console.log('🔍 [TTS_CONFIG] Environment check:', {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    currentOrigin: window.location.origin,
    envBackendUrl
  });
  
  if (envBackendUrl) {
    console.log('🔍 [TTS_CONFIG] Using environment variable:', envBackendUrl);
    return envBackendUrl;
  }

  // Auto-detect based on current domain
  const currentOrigin = window.location.origin;
  
  // Vercel deployment detection
  if (currentOrigin.includes('vercel.app') || currentOrigin.includes('localhost')) {
    const detectedUrl = 'https://beyondwords-express.onrender.com';
    console.log('🔍 [TTS_CONFIG] Auto-detected Vercel/localhost, using:', detectedUrl);
    return detectedUrl;
  }
  
  // Other deployments - assume same origin
  console.log('🔍 [TTS_CONFIG] Using current origin:', currentOrigin);
  return currentOrigin;
};

export const constructTTSUrl = (ttsUrl: string): string => {
  if (!ttsUrl.startsWith('/files/')) {
    // Already absolute URL
    return ttsUrl;
  }
  
  const baseUrl = getTTSBaseUrl();
  return `${baseUrl}${ttsUrl}`;
};

export const isTTSUrlAccessible = async (ttsUrl: string): Promise<boolean> => {
  try {
    const absoluteUrl = constructTTSUrl(ttsUrl);
    const response = await fetch(absoluteUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('TTS URL accessibility check failed:', error);
    return false;
  }
};
