import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { playTTSAudio as globalPlayTTSAudio, stopCurrentTTS, isTTSCurrentlyPlaying } from '../services/audioService';

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
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.log(`🎵 [WAIT_FOR_URL] Attempt ${i + 1} failed:`, error);
      }
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return false;
  }, []);

  const generateTTSForText = useCallback(async (text: string, language: string, cacheKey: string): Promise<string | null> => {
    try {
      console.log('🎵 [GENERATE_TTS] Starting TTS generation for:', text.substring(0, 50));
      setIsGeneratingTTS(prev => ({ ...prev, [cacheKey]: true }));

      const token = localStorage.getItem('jwt');
      const response = await axios.post('/api/tts', {
        text: text,
        language: language,
        cacheKey: cacheKey
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.data.ttsUrl) {
        console.log('🎵 [GENERATE_TTS] TTS URL generated:', response.data.ttsUrl);
        return response.data.ttsUrl;
      } else {
        console.error('🎵 [GENERATE_TTS] No TTS URL in response');
        return null;
      }
    } catch (error) {
      console.error('🎵 [GENERATE_TTS] Error generating TTS:', error);
      return null;
    } finally {
      setIsGeneratingTTS(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, []);

  const playTTSAudio = useCallback(async (text: string, language: string, cacheKey: string) => {
    console.log('🎵 [USE_TTS] Called with:', { text, language, cacheKey });

    // Check if TTS is already playing globally and stop it
    if (isTTSCurrentlyPlaying()) {
      console.log('🎵 [USE_TTS] TTS already playing globally, stopping current TTS first');
      stopCurrentTTS();
    }

    // Stop any currently playing audio in this hook (redundant with global stop, but good for local state sync)
    if (ttsAudioRef.current) {
      console.log('🎵 [USE_TTS] Stopping current audio in hook');
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }

    // Set playing state
    console.log('🎵 [USE_TTS] Setting playing state');
    setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: true }));
    setIsPlayingAnyTTS(true);
    setIsPlaying(true);
    setCurrentPlayingText(text);
    
    try {
      // Use the global TTS manager instead of local implementation
      console.log('🎵 [USE_TTS] Using global TTS manager');
      await globalPlayTTSAudio(text, language, cacheKey);
      console.log('🎵 [USE_TTS] Global TTS finished playing');
      
      // Update state when TTS finishes
      setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
      setIsPlayingAnyTTS(false);
      setIsPlaying(false);
      setCurrentPlayingText(null);
      
    } catch (error) {
      console.error('🎵 [USE_TTS] Error playing TTS:', error);
      setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
      setIsPlayingAnyTTS(false);
      setIsPlaying(false);
      setCurrentPlayingText(null);
      throw error;
    }
  }, []);

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
    
    try {
      // Check if URL is accessible
      const accessible = await waitForUrlAccessible(ttsUrl, 6, 300);
      if (!accessible) {
        throw new Error('Audio file not accessible');
      }
      
      const audio = new Audio(ttsUrl);
      ttsAudioRef.current = audio;
      
      // Set up event handlers
      audio.onended = () => {
        console.log('🎵 [PLAY_EXISTING_TTS] TTS finished playing');
        ttsAudioRef.current = null;
        setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
        setIsPlayingAnyTTS(false);
        setIsPlaying(false);
      };
      
      audio.onerror = (error) => {
        console.error('🎵 [PLAY_EXISTING_TTS] TTS audio error:', error);
        ttsAudioRef.current = null;
        setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
        setIsPlayingAnyTTS(false);
        setIsPlaying(false);
      };
      
      await audio.play();
      console.log('🎵 [PLAY_EXISTING_TTS] TTS started playing successfully');
      
    } catch (error) {
      console.error('🎵 [PLAY_EXISTING_TTS] Error playing TTS:', error);
      setIsPlayingTTS(prev => ({ ...prev, [cacheKey]: false }));
      setIsPlayingAnyTTS(false);
      setIsPlaying(false);
      throw error;
    }
  }, [waitForUrlAccessible]);

  const stopTTS = useCallback(() => {
    console.log('🎵 [STOP_TTS] Stopping TTS');
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    setIsPlayingTTS({});
    setIsPlayingAnyTTS(false);
    setIsPlaying(false);
    setCurrentPlayingText(null);
  }, []);

  const clearCache = useCallback(() => {
    console.log('🎵 [CLEAR_CACHE] Clearing TTS cache');
    ttsCache.current.clear();
  }, []);

  const processTtsQueue = useCallback(async () => {
    if (isProcessingQueue || ttsQueue.length === 0) {
      return;
    }

    setIsProcessingQueue(true);
    const [nextItem, ...remainingQueue] = ttsQueue;
    setTtsQueue(remainingQueue);

    try {
      await playTTSAudio(nextItem.text, nextItem.language, nextItem.cacheKey);
    } catch (error) {
      console.error('🎵 [PROCESS_QUEUE] Error processing TTS queue:', error);
    } finally {
      setIsProcessingQueue(false);
    }
  }, [isProcessingQueue, ttsQueue, playTTSAudio]);

  // Process queue when items are added
  useEffect(() => {
    if (ttsQueue.length > 0 && !isProcessingQueue && !isPlayingAnyTTS) {
      processTtsQueue();
    }
  }, [ttsQueue, isProcessingQueue, isPlayingAnyTTS, processTtsQueue]);

  return {
    isPlaying,
    currentPlayingText,
    ttsQueue,
    isProcessingQueue,
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


