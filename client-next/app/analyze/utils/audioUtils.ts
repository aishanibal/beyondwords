// Audio utility functions for recording and TTS

export const waitForUrlAccessible = async (url: string, attempts = 6, delayMs = 300): Promise<boolean> => {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${i + 1}: URL not accessible yet, waiting ${delayMs}ms...`);
    }
    
    if (i < attempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return false;
};

export const generateCacheKey = (text: string, language: string): string => {
  // Create a simple hash-like key for caching
  const normalizedText = text.toLowerCase().replace(/\s+/g, '_');
  const normalizedLang = language.toLowerCase();
  return `${normalizedLang}_${normalizedText.substring(0, 50)}`;
};

export const isAudioSupported = (): boolean => {
  return typeof window !== 'undefined' && 
         (window.AudioContext || (window as any).webkitAudioContext) !== undefined;
};

export const isMediaRecorderSupported = (): boolean => {
  return typeof window !== 'undefined' && 
         (window.MediaRecorder || (window as any).webkitMediaRecorder) !== undefined;
};

export const getSupportedMimeTypes = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav'
  ];
  
  return types.filter(type => {
    if (window.MediaRecorder) {
      return MediaRecorder.isTypeSupported(type);
    }
    return false;
  });
};

export const getOptimalMimeType = (): string => {
  const supportedTypes = getSupportedMimeTypes();
  return supportedTypes[0] || 'audio/webm';
};

export const createAudioElement = (): HTMLAudioElement => {
  const audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.preload = 'auto';
  return audio;
};

export const playAudio = (audio: HTMLAudioElement, url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const handleEnded = () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      resolve();
    };
    
    const handleError = (error: Event) => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      reject(error);
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    audio.src = url;
    audio.play().catch(reject);
  });
};

export const stopAudio = (audio: HTMLAudioElement): void => {
  audio.pause();
  audio.currentTime = 0;
  audio.src = '';
};

export const cleanupAudio = (audio: HTMLAudioElement): void => {
  stopAudio(audio);
  audio.remove();
};

