import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

interface TTSQueueItem {
  text: string;
  language: string;
  cacheKey: string;
}

interface TTSCacheEntry {
  url: string;
  timestamp: number;
}

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingText, setCurrentPlayingText] = useState<string | null>(null);
  const [ttsQueue, setTtsQueue] = useState<TTSQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isPlayingAnyTTS, setIsPlayingAnyTTS] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState<Record<string, boolean>>({});
  const [isPlayingTTS, setIsPlayingTTS] = useState<Record<string, boolean>>({});
  
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const autoSpeakRef = useRef(false);
  const ttsCache = useRef<Map<string, TTSCacheEntry>>(new Map());

  const waitForUrlAccessible = useCallback(async (url: string, attempts = 6, delayMs = 300): Promise<boolean> => {
    for (let i = 0; i < attempts; i++) {
      try {
        const head = await fetch(url, { method: 'HEAD', cache: 'no-store' as RequestCache });
        if (head.ok) return true;
        console.warn(`TTS URL not accessible, retry ${i + 1}/${attempts}`);
      } catch (e) {
        console.warn(`TTS URL error retry ${i + 1}/${attempts}:`, e);
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
    return false;
  }, []);

  const generateTTSForText = useCallback(async (text: string, language: string, cacheKey: string): Promise<string | null> => {
    console.log('🎵 [GENERATE_TTS] Called with:', { text, language, cacheKey });
    
    // Check cache first (cache for 5 minutes)
    const cached = ttsCache.current.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
      console.log('🎵 [GENERATE_TTS] Using cached URL:', cached.url);
      return cached.url;
    }
    
    // Set generating state
    console.log('🎵 [GENERATE_TTS] Setting generating state');
    setIsGeneratingTTS(prev => ({ ...prev, [cacheKey]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      console.log('🎵 [GENERATE_TTS] JWT token:', token ? 'present' : 'missing');
      
      // Call the TTS API (will be routed to Node.js server via Next.js rewrites)
      console.log('🎵 [GENERATE_TTS] Calling /api/tts with:', { text, language });
      
      let response;
      try {
        response = await axios.post('/api/tts', { text, language }, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
      } catch (primaryErr: any) {
        const status = primaryErr?.response?.status;
        console.warn('🎵 [GENERATE_TTS] /api/tts failed:', status, primaryErr?.response?.data);
        // Client-side fallback: call Express directly to bypass any Vercel route issues
        const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://beyondwords-express.onrender.com').replace(/\/$/, '');
        const primaryUrl = `${backendUrl}/api/tts`;
        const fallbackUrl = `${backendUrl}/api/tts-test`;
        try {
          if (token) {
            console.log('🎵 [GENERATE_TTS] Retrying direct Express /api/tts');
            response = await axios.post(primaryUrl, { text, language }, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              }
            });
          } else {
            console.log('🎵 [GENERATE_TTS] Retrying direct Express /api/tts-test (no token)');
            response = await axios.post(fallbackUrl, { text, language }, {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        } catch (directErr) {
          console.error('🎵 [GENERATE_TTS] Direct Express fallback failed:', directErr);
          throw primaryErr; // surface the original
        }
      }
      
      console.log('🎵 [GENERATE_TTS] TTS API response status:', response.status);
      console.log('🎵 [GENERATE_TTS] TTS API response data:', response.data);
      
      const ttsUrl = response.data.ttsUrl;
      if (ttsUrl) {
        // Cache the result
        ttsCache.current.set(cacheKey, { url: ttsUrl, timestamp: now });
        return ttsUrl;
      }
      return null;
    } catch (error) {
      console.error('Error generating TTS:', error);
      return null;
    } finally {
      setIsGeneratingTTS(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, []);

  const playTTSAudio = useCallback(async (text: string, language: string, cacheKey: string) => {
    console.log('🎵 [PLAY_TTS_AUDIO] Called with:', { text, language, cacheKey });

    // Stop any currently playing audio
    if (ttsAudioRef.current) {
      console.log('🎵 [PLAY_TTS_AUDIO] Stopping current audio');
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }

    // Set playing state
    console.log('🎵 [PLAY_TTS_AUDIO] Setting playing state');
    setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: true }));
    setIsPlayingAnyTTS(true);
    setIsPlaying(true);
    setCurrentPlayingText(text);
    
    try {
      console.log('🎵 [PLAY_TTS_AUDIO] Calling generateTTSForText...');
      const ttsUrl = await generateTTSForText(text, language, cacheKey);
      console.log('🎵 [PLAY_TTS_AUDIO] Generated TTS URL:', ttsUrl);
      
      if (ttsUrl) {
        // Handle both relative and absolute URLs from backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://beyondwords-express.onrender.com';
        const audioUrl = ttsUrl.startsWith('http') ? ttsUrl : `${backendUrl}${ttsUrl}`;
        console.log('🎵 [PLAY_TTS_AUDIO] Constructed audio URL:', audioUrl);
        
        const accessible = await waitForUrlAccessible(audioUrl, 6, 300);
        if (!accessible) {
          console.error('🎵 [PLAY_TTS_AUDIO] Audio file not accessible after retries');
          setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
          setIsPlayingAnyTTS(false);
          setIsPlaying(false);
          setCurrentPlayingText(null);
          return;
        }
        console.log('🎵 [PLAY_TTS_AUDIO] Audio file is accessible');
        
        const audio = new window.Audio(audioUrl);
        ttsAudioRef.current = audio;
        
        // Add more detailed event listeners for debugging
        audio.addEventListener('loadstart', () => console.log('🎵 [PLAY_TTS_AUDIO] Audio loading started'));
        audio.addEventListener('canplay', () => console.log('🎵 [PLAY_TTS_AUDIO] Audio can play'));
        audio.addEventListener('canplaythrough', () => console.log('🎵 [PLAY_TTS_AUDIO] Audio can play through'));
        audio.addEventListener('error', (e) => {
          console.error('🎵 [PLAY_TTS_AUDIO] Audio error event:', e);
          console.error('🎵 [PLAY_TTS_AUDIO] Audio error details:', audio.error);
        });
        
        // Return a promise that resolves when audio finishes
        return new Promise<void>((resolve, reject) => {
          let timeoutId: NodeJS.Timeout;
          let resolved = false;
          
          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            resolved = true;
          };
          
          // Set a timeout to prevent infinite "playing" state
          timeoutId = setTimeout(() => {
            if (!resolved) {
              console.error('🎵 [PLAY_TTS_AUDIO] Audio playback timeout after 30 seconds');
              ttsAudioRef.current = null;
              setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
              setIsPlayingAnyTTS(false);
              setIsPlaying(false);
              setCurrentPlayingText(null);
              cleanup();
              reject(new Error('TTS audio playback timeout'));
            }
          }, 30000);
          
          audio.onended = () => {
            if (!resolved) {
              console.log('🎵 [PLAY_TTS_AUDIO] Audio playback ended');
              ttsAudioRef.current = null;
              setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
              setIsPlayingAnyTTS(false);
              setIsPlaying(false);
              setCurrentPlayingText(null);
              cleanup();
              resolve();
            }
          };
          
          audio.onerror = (e) => {
            if (!resolved) {
              console.error('🎵 [PLAY_TTS_AUDIO] Audio error:', e);
              console.error('🎵 [PLAY_TTS_AUDIO] Audio error details:', audio.error);
              ttsAudioRef.current = null;
              setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
              setIsPlayingAnyTTS(false);
              setIsPlaying(false);
              setCurrentPlayingText(null);
              cleanup();
              reject(new Error('TTS audio playback failed'));
            }
          };
          
          console.log('🎵 [PLAY_TTS_AUDIO] Attempting to play audio...');
          audio.play().catch((playError) => {
            if (!resolved) {
              console.error('🎵 [PLAY_TTS_AUDIO] Audio play() failed:', playError);
              ttsAudioRef.current = null;
              setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
              setIsPlayingAnyTTS(false);
              setIsPlaying(false);
              setCurrentPlayingText(null);
              cleanup();
              reject(playError);
            }
          });
        });
      } else {
        console.error('🎵 [PLAY_TTS_AUDIO] No TTS URL generated');
        setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
        setIsPlayingAnyTTS(false);
        setIsPlaying(false);
        setCurrentPlayingText(null);
      }
    } catch (error) {
      console.error('Error playing TTS:', error);
      setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
      setIsPlayingAnyTTS(false);
      setIsPlaying(false);
      setCurrentPlayingText(null);
      throw error;
    }
  }, [generateTTSForText, waitForUrlAccessible]);

  const playExistingTTS = useCallback(async (ttsUrl: string, cacheKey: string) => {
    // Stop any currently playing audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    
    // Set playing state
    setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: true }));
    setIsPlayingAnyTTS(true);
    setIsPlaying(true);
    setCurrentPlayingText('Playing audio...');
    
    try {
      // Handle both relative and absolute URLs from backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://beyondwords-express.onrender.com';
      const audioUrl = ttsUrl.startsWith('http') ? ttsUrl : `${backendUrl}${ttsUrl}`;
      const audio = new window.Audio(audioUrl);
      ttsAudioRef.current = audio;
      
      audio.onended = () => {
        ttsAudioRef.current = null;
        setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
        setIsPlayingAnyTTS(false);
        setIsPlaying(false);
        setCurrentPlayingText(null);
      };
      
      audio.onerror = () => {
        console.error('Error playing existing TTS audio');
        ttsAudioRef.current = null;
        setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
        setIsPlayingAnyTTS(false);
        setIsPlaying(false);
        setCurrentPlayingText(null);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing existing TTS:', error);
      setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
      setIsPlayingAnyTTS(false);
      setIsPlaying(false);
      setCurrentPlayingText(null);
    }
  }, []);

  const processTtsQueue = useCallback(async () => {
    if (isProcessingQueue || ttsQueue.length === 0) return;
    
    console.log('[DEBUG] Starting TTS queue processing, queue length:', ttsQueue.length);
    setIsProcessingQueue(true);
    
    while (ttsQueue.length > 0 && autoSpeakRef.current) {
      const nextTts = ttsQueue[0];
      console.log('[DEBUG] Processing TTS queue item:', nextTts.cacheKey);
      setTtsQueue(prev => prev.slice(1)); // Remove the first item
      
      try {
        await playTTSAudio(nextTts.text, nextTts.language, nextTts.cacheKey);
        
        // Wait for the TTS to finish playing
        while (isPlayingAnyTTS && autoSpeakRef.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('[DEBUG] Finished playing TTS queue item:', nextTts.cacheKey);
      } catch (error) {
        console.error('Error processing TTS queue item:', error);
      }
    }
    
    setIsProcessingQueue(false);
    console.log('[DEBUG] Finished TTS queue processing');
  }, [isProcessingQueue, ttsQueue, playTTSAudio, isPlayingAnyTTS]);

  const stopTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentPlayingText(null);
    setIsPlayingAnyTTS(false);
    setTtsQueue([]);
  }, []);

  const clearCache = useCallback(() => {
    ttsCache.current.clear();
  }, []);

  // Process queue when it changes
  useEffect(() => {
    if (ttsQueue.length > 0 && !isPlaying && !isProcessingQueue) {
      processTtsQueue();
    }
  }, [ttsQueue, isPlaying, isProcessingQueue, processTtsQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    currentPlayingText,
    ttsQueue: ttsQueue.length,
    isPlayingAnyTTS,
    isGeneratingTTS,
    isPlayingTTS,
    playTTSAudio,
    playExistingTTS,
    stopTTS,
    clearCache,
    generateTTSForText,
    processTtsQueue,
  };
}
