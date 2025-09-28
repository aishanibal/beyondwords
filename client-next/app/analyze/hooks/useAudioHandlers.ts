import { useRef, useState, useCallback } from 'react';
import { processAudioWithPipeline } from '../services/audioService';
import { saveMessageToBackend } from '../services/conversationService';
import { getTTSText } from '../services/audioService';
import { ChatMessage } from '../types/analyze';
import { TTS_TIMEOUTS } from '../config/constants';
import { useTTS } from './useTTS';

export const useAudioHandlers = (
  user: any,
  language: string,
  conversationId: string | null,
  userPreferences: any,
  chatHistory: ChatMessage[],
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>,
  autoSpeak: boolean,
  enableShortFeedback: boolean,
  isAnyTTSPlaying: boolean,
  setIsAnyTTSPlaying: React.Dispatch<React.SetStateAction<boolean>>,
  setAiTTSQueued: React.Dispatch<React.SetStateAction<{ text: string; language: string; cacheKey: string } | null>>,
  setShortFeedback: React.Dispatch<React.SetStateAction<string>>,
  setIsPlayingTTS: React.Dispatch<React.SetStateAction<{[key: string]: boolean}>>,
  ttsAudioRef: React.MutableRefObject<HTMLAudioElement | null>
) => {
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const interruptedRef = useRef<boolean>(false);
  const autoSpeakRef = useRef<boolean>(autoSpeak);
  const MediaRecorderClassRef = useRef<typeof MediaRecorder | null>(null);
  const SpeechRecognitionClassRef = useRef<any>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [manualRecording, setManualRecording] = useState(false);

  // Use TTS hook for TTS functionality
  const { generateTTSForText, playTTSAudio } = useTTS();

  // Update autoSpeakRef when autoSpeak changes
  autoSpeakRef.current = autoSpeak;

  const handleStartRecording = useCallback(async () => {
    console.log('🔍 [DEBUG] handleStartRecording called');
    setWasInterrupted(false);
    
    // Prevent recording when TTS is playing
    if (isAnyTTSPlaying) {
      console.log('🔍 [DEBUG] Cannot start recording - TTS is playing:', { isAnyTTSPlaying });
      return;
    }
    
    if (!MediaRecorderClassRef.current) {
      alert('MediaRecorder API not supported in this browser.');
      return;
    }
    
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not available in this browser. Please use a modern browser with microphone support.');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorderClassRef.current(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        console.log('🔍 [DEBUG] MediaRecorder onstop event triggered');
        console.log('🔍 [DEBUG] interruptedRef.current:', interruptedRef.current);
        console.log('🔍 [DEBUG] audioChunksRef.current length:', audioChunksRef.current.length);
        
        if (interruptedRef.current) {
          console.log('🔍 [DEBUG] Recording was interrupted, cleaning up');
          interruptedRef.current = false;
          setWasInterrupted(true);
          stream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
          setIsRecording(false);
          setManualRecording(false);
          return;
        }
        
        console.log('🔍 [DEBUG] Creating audio blob and sending to backend');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('🔍 [DEBUG] Audio blob created:', audioBlob.size, 'bytes');
        sendAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setIsRecording(false);
        setManualRecording(false);
      };
      mediaRecorder.start();
      setIsRecording(true);
      if (autoSpeakRef.current) {
        // Use SpeechRecognition for silence detection in autospeak mode only
        if (!SpeechRecognitionClassRef.current) {
          alert('SpeechRecognition API not supported in this browser.');
          return;
        }
        const recognition = new SpeechRecognitionClassRef.current();
        recognitionRef.current = recognition;
        recognition.lang = language || 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;
        
        // Set longer timeout for autospeak mode to give users more time to speak
        if (autoSpeakRef.current) {
          recognition.maxAlternatives = 1;
          setTimeout(() => {
            if (recognitionRef.current) {
              console.log('[DEBUG] Autospeak: Speech recognition timeout reached, stopping recording');
              recognitionRef.current.stop();
            }
          }, TTS_TIMEOUTS.autospeak);
        }
        recognition.onresult = (event: unknown) => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
        recognition.onerror = (event: unknown) => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          alert('Speech recognition error: ' + (event as any).error);
        };
        recognition.onend = () => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
        recognition.start();
        setManualRecording(false);
      } else {
        // Manual mode: no speech recognition, just record until user stops
        setManualRecording(true);
      }
    } catch (err: unknown) {
      console.error('Error starting recording:', err);
      alert('Failed to access microphone. Please check permissions.');
    }
  }, [language, isAnyTTSPlaying]);

  const handleStopRecording = useCallback((interrupted: boolean = false) => {
    if (interrupted) {
      interruptedRef.current = true;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    setIsRecording(false);
    setManualRecording(false);
  }, [mediaStream]);

  const sendAudioToBackend = useCallback(async (audioBlob: Blob) => {
    console.log('🔍 [DEBUG] sendAudioToBackend called with audioBlob:', audioBlob);
    if (!(audioBlob instanceof Blob)) {
      console.error('🔍 [DEBUG] Invalid audio blob provided');
      return;
    }
    
    try {
      console.log('🔍 [DEBUG] Starting audio processing...');
      setIsProcessing(true);
      
      // Add user message immediately with a placeholder
      const placeholderMessage = { 
        sender: 'User', 
        text: '🎤 Processing your message...', 
        romanizedText: '',
        timestamp: new Date(),
        isFromOriginalConversation: false,
        isProcessing: true
      };
      
      console.log('🔍 [DEBUG] Adding placeholder message to chat history');
      // Add placeholder message immediately
      setChatHistory(prev => [...prev, placeholderMessage]);
      
      // Process audio with full pipeline
      console.log('🔍 [DEBUG] Starting processAudioWithPipeline...');
      const result = await processAudioWithPipeline(
        audioBlob,
        language,
        chatHistory,
        userPreferences,
        autoSpeak,
        enableShortFeedback,
        user
      );
      console.log('🔍 [DEBUG] processAudioWithPipeline completed:', result);
      
      // Replace the placeholder message with the actual transcript
      console.log('🔍 [DEBUG] Replacing placeholder with transcription:', result.transcription);
      setChatHistory(prev => {
        const updated = prev.map((msg, index) => {
          if (msg.isProcessing && msg.sender === 'User') {
            console.log('🔍 [DEBUG] Found processing message, replacing with:', result.transcription);
            return {
              ...msg,
              text: result.transcription,
              romanizedText: result.userMessage.romanizedText,
              isProcessing: false
            };
          }
          return msg;
        });
        return updated;
      });
      
      // Save user message to backend
      if (conversationId) {
        console.log('[MESSAGE_SAVE] Saving user message to conversation:', conversationId);
        await saveMessageToBackend(result.userMessage, conversationId);
      } else {
        console.warn('[MESSAGE_SAVE] No conversation ID available for user message');
      }
      
      // Show short feedback if available
      if (result.shortFeedback) {
        setShortFeedback(result.shortFeedback);
      }
      
      // Add AI response if present
      if (result.aiMessage) {
        // Add AI processing message
        const aiProcessingMessage = { 
          sender: 'AI', 
          text: '🤖 Processing AI response...', 
          romanizedText: '',
          timestamp: new Date(),
          isFromOriginalConversation: false,
          isProcessing: true
        };
        console.log('🔍 [DEBUG] Adding AI processing message to chat history');
        setChatHistory(prev => [...prev, aiProcessingMessage]);
        
        // Replace processing message with actual AI response
        setChatHistory(prev => {
          const updated = prev.map((msg, index) => {
            if (msg.isProcessing && msg.sender === 'AI') {
              return {
                ...msg,
                text: result.aiMessage!.text,
                romanizedText: result.aiMessage!.romanizedText,
                ttsUrl: null,
                isProcessing: false
              };
            }
            return msg;
          });
          return updated;
        });
        
        // Save AI message to backend
        if (conversationId) {
          console.log('[MESSAGE_SAVE] Saving AI message to conversation:', conversationId);
          await saveMessageToBackend(result.aiMessage, conversationId);
        } else {
          console.warn('[MESSAGE_SAVE] No conversation ID available for AI message');
        }
        
        // Play TTS for AI response immediately
        console.log('[DEBUG] Playing TTS for AI response immediately');
        const ttsText = getTTSText(result.aiMessage, userPreferences?.romanizationDisplay || 'both', language);
        const cacheKey = `ai_message_auto_${Date.now()}`;
        
        // Play audio immediately for all AI messages
        playTTSAudio(ttsText, language, cacheKey).catch(error => {
          console.error('[DEBUG] Error playing AI TTS:', error);
        });
        
        // Also queue for autospeak mode if enabled
        if (autoSpeak) {
          console.log('[DEBUG] Adding AI response TTS to queue for autospeak mode');
          setAiTTSQueued({ text: ttsText, language, cacheKey });
        }
      } else {
        console.log('🔍 [DEBUG] No AI response found!');
        
        // Add a fallback message when no AI response is received
        const fallbackMessage = {
          sender: 'AI',
          text: 'Hello! What would you like to talk about today?',
          romanizedText: '',
          timestamp: new Date(),
          isFromOriginalConversation: false
        };
        
        setChatHistory(prev => {
          const updated = prev.map((msg, index) => {
            if (msg.isProcessing && msg.sender === 'AI') {
              console.log('🔍 [DEBUG] Replacing processing message with fallback');
              return fallbackMessage;
            }
            return msg;
          });
          return updated;
        });
      }
      
    } catch (error: unknown) {
      console.error('🔍 [DEBUG] Error processing audio:', error);
      console.error('🔍 [DEBUG] Error details:', {
        message: (error as any)?.message,
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data,
        stack: (error as any)?.stack
      });
      
      const errorMessage = {
        sender: 'System',
        text: '❌ Error processing audio. Please try again.',
        timestamp: new Date(),
        isFromOriginalConversation: false
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      console.log('🔍 [DEBUG] Audio processing completed, setting isProcessing to false');
      setIsProcessing(false);
    }
  }, [language, chatHistory, userPreferences, autoSpeak, enableShortFeedback, conversationId, setChatHistory, setIsProcessing, setShortFeedback, setAiTTSQueued]);

  const handlePlayTTS = useCallback(async (text: string, language: string, cacheKey?: string) => {
    console.log('🎵 [PLAY_TTS_AUDIO] Called with:', { text, language, cacheKey });
    console.log('🎵 [PLAY_TTS_AUDIO] Text length:', text.length);
    console.log('🎵 [PLAY_TTS_AUDIO] Language:', language);
    console.log('🎵 [PLAY_TTS_AUDIO] Cache key:', cacheKey);

    const finalCacheKey = cacheKey || `manual_tts_${Date.now()}`;

    // Stop any currently playing audio
    if (ttsAudioRef.current) {
      console.log('🎵 [PLAY_TTS_AUDIO] Stopping current audio');
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }

    // Set playing state
    console.log('🎵 [PLAY_TTS_AUDIO] Setting playing state');
    setIsPlayingTTS(prev => ({ ...prev, [finalCacheKey]: true }));
    // setIsPlayingAnyTTS(true); // Removed - using playTTSAudio from useTTS hook
    
    try {
      console.log('🎵 [PLAY_TTS_AUDIO] Calling generateTTSForText...');
      const ttsUrl = await generateTTSForText(text, language, finalCacheKey);
      console.log('🎵 [PLAY_TTS_AUDIO] Generated TTS URL:', ttsUrl);
      
      if (ttsUrl) {
        // Handle both relative and absolute URLs from backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://beyondwords-express.onrender.com';
        const audioUrl = ttsUrl.startsWith('http') ? ttsUrl : `${backendUrl}${ttsUrl}`;
        console.log('🎵 [PLAY_TTS_AUDIO] Constructed audio URL:', audioUrl);
        
        // Check if the audio file exists before creating Audio object (with retry)
        const waitForUrlAccessible = async (url: string, attempts = 6, delayMs = 300): Promise<boolean> => {
          for (let i = 0; i < attempts; i++) {
            try {
              const head = await fetch(url, { method: 'HEAD', cache: 'no-store' as RequestCache });
              if (head.ok) return true;
              console.warn(`🎵 [PLAY_TTS_AUDIO] HEAD ${head.status} retry ${i + 1}/${attempts}`);
            } catch (e) {
              console.warn(`🎵 [PLAY_TTS_AUDIO] HEAD error retry ${i + 1}/${attempts}:`, e);
            }
            await new Promise(r => setTimeout(r, delayMs));
          }
          return false;
        };

        const accessible = await waitForUrlAccessible(audioUrl, 6, 300);
        if (!accessible) {
          console.error('🎵 [PLAY_TTS_AUDIO] Audio file not accessible after retries');
          setIsPlayingTTS(prev => ({ ...prev, [finalCacheKey]: false }));
          // setIsPlayingAnyTTS(false); // Removed - using playTTSAudio from useTTS hook
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
              setIsPlayingTTS(prev => ({ ...prev, [finalCacheKey]: false }));
              // setIsPlayingAnyTTS(false); // Removed - using playTTSAudio from useTTS hook
              cleanup();
              reject(new Error('TTS audio playback timeout'));
            }
          }, 30000);
          
          audio.onended = () => {
            if (!resolved) {
              console.log('🎵 [PLAY_TTS_AUDIO] Audio playback ended');
              ttsAudioRef.current = null;
              setIsPlayingTTS(prev => ({ ...prev, [finalCacheKey]: false }));
              // setIsPlayingAnyTTS(false); // Removed - using playTTSAudio from useTTS hook
              cleanup();
              resolve();
            }
          };
          
          audio.onerror = () => {
            if (!resolved) {
              console.error('🎵 [PLAY_TTS_AUDIO] Audio playback error');
              ttsAudioRef.current = null;
              setIsPlayingTTS(prev => ({ ...prev, [finalCacheKey]: false }));
              // setIsPlayingAnyTTS(false); // Removed - using playTTSAudio from useTTS hook
              cleanup();
              reject(new Error('TTS audio playback error'));
            }
          };
          
          // Start playing
          audio.play().catch(error => {
            if (!resolved) {
              console.error('🎵 [PLAY_TTS_AUDIO] Audio play failed:', error);
              ttsAudioRef.current = null;
              setIsPlayingTTS(prev => ({ ...prev, [finalCacheKey]: false }));
              // setIsPlayingAnyTTS(false); // Removed - using playTTSAudio from useTTS hook
              cleanup();
              reject(error);
            }
          });
        });
      } else {
        console.error('🎵 [PLAY_TTS_AUDIO] No TTS URL generated');
        setIsPlayingTTS(prev => ({ ...prev, [finalCacheKey]: false }));
        // setIsPlayingAnyTTS(false); // Removed - using playTTSAudio from useTTS hook
      }
    } catch (error) {
      console.error('🎵 [PLAY_TTS_AUDIO] Error:', error);
      setIsPlayingTTS(prev => ({ ...prev, [finalCacheKey]: false }));
      // setIsPlayingAnyTTS(false); // Removed - using playTTSAudio from useTTS hook
      throw error;
    }
  }, []);

  const handlePlayExistingTTS = useCallback((ttsUrl: string) => {
    try {
      const audio = new Audio(ttsUrl);
      audio.play().catch(error => {
        console.error('Failed to play existing TTS audio:', error);
      });
    } catch (error) {
      console.error('Error playing existing TTS:', error);
    }
  }, []);

  return {
    isRecording,
    wasInterrupted,
    manualRecording,
    handleStartRecording,
    handleStopRecording,
    playTTSAudio,
    handlePlayExistingTTS,
    recognitionRef,
    mediaRecorderRef,
    MediaRecorderClassRef,
    SpeechRecognitionClassRef
  };
};
