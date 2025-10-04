/**
 * TTS Configuration Test
 * Use this to test TTS URL construction in different environments
 */

import { getTTSBaseUrl, constructTTSUrl, isTTSUrlAccessible } from './ttsConfig';

export const testTTSConfiguration = () => {
  console.log('🧪 [TTS_TEST] Testing TTS Configuration...');
  
  // Test 1: Get base URL
  const baseUrl = getTTSBaseUrl();
  console.log('🧪 [TTS_TEST] Base URL:', baseUrl);
  
  // Test 2: Construct TTS URL
  const testTtsUrl = '/files/tts_test_123.wav';
  const absoluteUrl = constructTTSUrl(testTtsUrl);
  console.log('🧪 [TTS_TEST] Constructed URL:', absoluteUrl);
  
  // Test 3: Check accessibility (async)
  isTTSUrlAccessible(testTtsUrl).then(isAccessible => {
    console.log('🧪 [TTS_TEST] URL accessible:', isAccessible);
  }).catch(error => {
    console.log('🧪 [TTS_TEST] URL accessibility check failed:', error);
  });
  
  return {
    baseUrl,
    absoluteUrl,
    testTtsUrl
  };
};

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🧪 [TTS_TEST] Auto-running TTS configuration test...');
  testTTSConfiguration();
}
