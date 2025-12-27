/**
 * TTS Configuration for deployment
 * Handles URL construction for TTS files across different environments
 */

export const getTTSBaseUrl = (): string => {
  // TTS now goes through Next.js API routes which proxy to Python backend
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.origin;
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
