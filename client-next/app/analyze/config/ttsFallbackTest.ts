/**
 * TTS Fallback Test
 * Use this to test the browser speech synthesis fallback
 */

export const testTTSFallback = async (text: string = "Hello, this is a test of the TTS fallback system.", language: string = "en"): Promise<void> => {
  console.log('🧪 [TTS_FALLBACK_TEST] Testing browser speech synthesis fallback...');
  
  if (!('speechSynthesis' in window)) {
    console.error('❌ [TTS_FALLBACK_TEST] Speech synthesis not supported in this browser');
    throw new Error('Speech synthesis not supported');
  }

  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      console.log('🔊 [TTS_FALLBACK_TEST] Speech synthesis started');
    };

    utterance.onend = () => {
      console.log('✅ [TTS_FALLBACK_TEST] Speech synthesis completed successfully');
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('❌ [TTS_FALLBACK_TEST] Speech synthesis error:', event.error);
      reject(new Error(`Speech synthesis failed: ${event.error}`));
    };

    console.log('🔊 [TTS_FALLBACK_TEST] Starting speech synthesis...');
    speechSynthesis.speak(utterance);
  });
};

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🧪 [TTS_FALLBACK_TEST] Auto-running TTS fallback test...');
  // Uncomment the line below to auto-test on page load
  // testTTSFallback().catch(console.error);
}
