import React, { useRef, useState, useCallback } from 'react';
import { processAudioWithPipeline } from '../services/audioService';
import { saveMessageToBackend } from '../services/conversationService';
import { playTTSAudio, getTTSText, stopCurrentTTS, isTTSCurrentlyPlaying } from '../services/audioService';
import { ChatMessage } from '../types/analyze';
import { TTS_TIMEOUTS } from '../config/constants';
import { constructTTSUrl, isTTSUrlAccessible } from '../config/ttsConfig';

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
  setIsPlayingShortFeedbackTTS: React.Dispatch<React.SetStateAction<boolean>>,
  clearSuggestionCarousel?: () => void
) => {
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const interruptedRef = useRef<boolean>(false);
  const manualStopRef = useRef<boolean>(false);
  const autoSpeakRef = useRef<boolean>(autoSpeak);
  const MediaRecorderClassRef = useRef<typeof MediaRecorder | null>(null);
  const SpeechRecognitionClassRef = useRef<any>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [manualRecording, setManualRecording] = useState(false);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingAudioRef = useRef<boolean>(false);

  // Update autoSpeakRef when autoSpeak changes
  autoSpeakRef.current = autoSpeak;
  
  // Clear any stuck recording messages on initialization
  React.useEffect(() => {
    console.log('🔍 [DEBUG] useAudioHandlers initialized, clearing any stuck recording messages');
    setChatHistory(prev => prev.filter(msg => !(msg.isRecording && msg.sender === 'User')));
  }, []);

  const handleStartRecording = useCallback(async () => {
    console.log('🔍 [DEBUG] handleStartRecording called');
    setWasInterrupted(false);
    interruptedRef.current = false;
    manualStopRef.current = false;
    isProcessingAudioRef.current = false; // Reset processing flag
    
    // Prevent recording when TTS is playing
    if (isAnyTTSPlaying) {
      console.log('🔍 [DEBUG] Cannot start recording - TTS is playing:', { isAnyTTSPlaying });
      return;
    }
    
    // Add loading message immediately when recording starts
    const recordingMessage = { 
      sender: 'User', 
      text: '🎤 Recording...', 
      romanizedText: '',
      timestamp: new Date(),
      isFromOriginalConversation: false,
      isRecording: true
    };
    
    console.log('🔍 [DEBUG] Adding recording message to chat history');
    setChatHistory(prev => [...prev, recordingMessage]);
    
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
      // Configure audio constraints for better speech recording
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      setMediaStream(stream);
      audioChunksRef.current = [];
      
      // Get optimal MIME type for speech recording
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/wav';
      
      console.log('🔍 [DEBUG] Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorderClassRef.current(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          console.log('🔍 [DEBUG] Audio chunk received:', e.data.size, 'bytes');
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        console.log('🔍 [DEBUG] MediaRecorder onstop event triggered');
        console.log('🔍 [DEBUG] interruptedRef.current:', interruptedRef.current);
        console.log('🔍 [DEBUG] manualStopRef.current:', manualStopRef.current);
        console.log('🔍 [DEBUG] isProcessingAudioRef.current:', isProcessingAudioRef.current);
        console.log('🔍 [DEBUG] audioChunksRef.current length:', audioChunksRef.current.length);
        console.log('🔍 [DEBUG] Total audio chunks size:', audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0), 'bytes');
        
        // Prevent multiple processing of the same audio
        if (isProcessingAudioRef.current) {
          console.log('🔍 [DEBUG] Audio already being processed, ignoring duplicate onstop event');
          return;
        }
        
        if (interruptedRef.current) {
          console.log('🔍 [DEBUG] Recording was interrupted, cleaning up');
          interruptedRef.current = false;
          manualStopRef.current = false;
          setWasInterrupted(true);
          stream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
          setIsRecording(false);
          setManualRecording(false);
          return;
        }
        
        if (manualStopRef.current) {
          console.log('🔍 [DEBUG] Manual stop detected, processing audio');
          manualStopRef.current = false;
        }
        
        // Set processing flag to prevent duplicate calls
        isProcessingAudioRef.current = true;
        console.log('🔍 [DEBUG] Creating audio blob and sending to backend');
        
        // Check if we have any audio chunks
        if (audioChunksRef.current.length === 0) {
          console.error('🔍 [DEBUG] No audio chunks recorded!');
          // Remove the recording message and add error message
          setChatHistory(prev => {
            const filtered = prev.filter(msg => !(msg.isRecording && msg.sender === 'User'));
            const errorMessage = {
              sender: 'System',
              text: '❌ No audio recorded. Please try again.',
              timestamp: new Date(),
              isFromOriginalConversation: false
            };
            return [...filtered, errorMessage];
          });
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('🔍 [DEBUG] Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: audioChunksRef.current.length,
          mimeType: mimeType
        });
        
        // Check if audio blob is valid
        if (audioBlob.size === 0) {
          console.error('🔍 [DEBUG] Audio blob is empty!');
          // Remove the recording message and add error message
          setChatHistory(prev => {
            const filtered = prev.filter(msg => !(msg.isRecording && msg.sender === 'User'));
            const errorMessage = {
              sender: 'System',
              text: '❌ Empty audio recorded. Please try again.',
              timestamp: new Date(),
              isFromOriginalConversation: false
            };
            return [...filtered, errorMessage];
          });
          return;
        }
        
        sendAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setIsRecording(false);
        setManualRecording(false);
      };
      
      // Start recording with timeslice to get regular audio chunks
      mediaRecorder.start(100); // 100ms timeslice for better audio capture
      setIsRecording(true);
      
      // Set a timeout to automatically stop recording after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        console.log('🔍 [DEBUG] Recording timeout reached, stopping recording automatically');
        handleStopRecording(false);
      }, 30000);
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
      
      // Remove the recording message if recording failed
      setChatHistory(prev => prev.filter(msg => !(msg.isRecording && msg.sender === 'User')));
    }
  }, [language, isAnyTTSPlaying]);

  const handleStopRecording = useCallback((isManualStop: boolean = true) => {
    console.log('🔍 [DEBUG] handleStopRecording called, isManualStop:', isManualStop);
    
    // Clear the recording timeout
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    if (isManualStop) {
      manualStopRef.current = true;
      console.log('🔍 [DEBUG] Manual stop detected, setting manualStopRef to true');
    } else {
      interruptedRef.current = true;
      console.log('🔍 [DEBUG] Interruption detected, setting interruptedRef to true');
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

  // Cleanup function to clear timeout on unmount
  const cleanup = useCallback(() => {
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    interruptedRef.current = false;
    manualStopRef.current = false;
    isProcessingAudioRef.current = false;
  }, []);

  const sendAudioToBackend = useCallback(async (audioBlob: Blob) => {
    console.log('🔍 [DEBUG] sendAudioToBackend called with audioBlob:', audioBlob);
    if (!(audioBlob instanceof Blob)) {
      console.error('🔍 [DEBUG] Invalid audio blob provided');
      // Remove any recording message if audio blob is invalid
      setChatHistory(prev => prev.filter(msg => !(msg.isRecording && msg.sender === 'User')));
      return;
    }
    
    try {
      console.log('🔍 [DEBUG] Starting audio processing...');
      setIsProcessing(true);
      
      // Replace recording message with processing message
      setChatHistory(prev => {
        const updated = prev.map((msg, index) => {
          if (msg.isRecording && msg.sender === 'User') {
            console.log('🔍 [DEBUG] Replacing recording message with processing message');
            return {
              ...msg,
              text: '🎤 Processing your message...',
              isRecording: false,
              isProcessing: true
            };
          }
          return msg;
        });
        
        // Fallback: if no recording message found, add processing message
        const hasRecordingMessage = updated.some(msg => msg.isRecording && msg.sender === 'User');
        if (!hasRecordingMessage) {
          console.log('🔍 [DEBUG] No recording message found, adding processing message as fallback');
          const processingMessage = {
            sender: 'User',
            text: '🎤 Processing your message...',
            romanizedText: '',
            timestamp: new Date(),
            isFromOriginalConversation: false,
            isProcessing: true
          };
          return [...updated, processingMessage];
        }
        
        return updated;
      });
      
      // Process audio with full pipeline
      console.log('🔍 [DEBUG] Calling processAudioWithPipeline...');
      
      // Add timeout to prevent getting stuck
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transcription timeout after 30 seconds')), 30000);
      });
      
      const result = await Promise.race([
        processAudioWithPipeline(
          audioBlob,
          language,
          chatHistory,
          userPreferences,
          autoSpeak,
          enableShortFeedback
        ),
        timeoutPromise
      ]) as any;
      
      console.log('🔍 [DEBUG] processAudioWithPipeline completed:', result);
      
      // Replace the placeholder message with the actual transcript
      setChatHistory(prev => {
        // Check if this transcription already exists to prevent duplicates
        const transcriptionExists = prev.some(msg => 
          msg.sender === 'User' && 
          msg.text === result.transcription && 
          !msg.isProcessing && 
          !msg.isRecording
        );
        
        if (transcriptionExists) {
          console.log('🔍 [DEBUG] Transcription already exists, preventing duplicate');
          // Just remove any processing messages
          return prev.filter(msg => !(msg.isProcessing && msg.sender === 'User'));
        }
        
        const updated = prev.map((msg, index) => {
          if (msg.isProcessing && msg.sender === 'User') {
            console.log('🔍 [DEBUG] Replacing processing message with actual transcription:', result.transcription);
            return {
              ...msg,
              text: result.transcription,
              romanizedText: result.userMessage.romanizedText,
              isProcessing: false
            };
          }
          return msg;
        });
        
        // Fallback: if no processing message found, add transcription message
        const hasProcessingMessage = updated.some(msg => msg.isProcessing && msg.sender === 'User');
        if (!hasProcessingMessage) {
          console.log('🔍 [DEBUG] No processing message found, adding transcription message as fallback');
          const transcriptionMessage = {
            sender: 'User',
            text: result.transcription,
            romanizedText: result.userMessage.romanizedText,
            timestamp: new Date(),
            isFromOriginalConversation: false,
            isProcessing: false
          };
          return [...updated, transcriptionMessage];
        }
        
        return updated;
      });
      
      // Clear suggestion carousel when new user message is added
      if (clearSuggestionCarousel) {
        console.log('🔍 [DEBUG] Clearing suggestion carousel due to new user transcription');
        clearSuggestionCarousel();
      }
      
      // Save user message to backend
      if (conversationId) {
        console.log('[MESSAGE_SAVE] Saving user message to conversation:', conversationId);
        await saveMessageToBackend(result.userMessage, conversationId);
      } else {
        console.warn('[MESSAGE_SAVE] No conversation ID available for user message');
      }
      
      // Show short feedback if available and play TTS automatically
      if (result.shortFeedback) {
        setShortFeedback(result.shortFeedback);
        
        // Play short feedback TTS immediately for all modes
        const cacheKey = `short_feedback_${Date.now()}`;
        console.log('[DEBUG] Playing short feedback TTS immediately');
        setIsPlayingShortFeedbackTTS(true);
        setIsAnyTTSPlaying(true);
        playTTSAudio(result.shortFeedback, language, cacheKey).then(() => {
          console.log('[DEBUG] Short feedback TTS finished');
          setIsPlayingShortFeedbackTTS(false);
          setIsAnyTTSPlaying(false);
        }).catch(error => {
          console.error('[DEBUG] Error playing short feedback TTS:', error);
          setIsPlayingShortFeedbackTTS(false);
          setIsAnyTTSPlaying(false);
        });
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
        setIsAnyTTSPlaying(true);
        playTTSAudio(ttsText, language, cacheKey).then(() => {
          console.log('[DEBUG] AI response TTS finished');
          setIsAnyTTSPlaying(false);
        }).catch(error => {
          console.error('[DEBUG] Error playing AI TTS:', error);
          setIsAnyTTSPlaying(false);
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
      
      // Remove both processing and recording messages and add error message
      setChatHistory(prev => {
        const filtered = prev.filter(msg => !(msg.isProcessing && msg.sender === 'User') && !(msg.isRecording && msg.sender === 'User'));
        const errorMessage = {
          sender: 'System',
          text: `❌ Error processing audio: ${(error as any)?.message || 'Unknown error'}. Please try again.`,
          timestamp: new Date(),
          isFromOriginalConversation: false
        };
        return [...filtered, errorMessage];
      });
    } finally {
      console.log('🔍 [DEBUG] Audio processing completed, setting isProcessing to false');
      setIsProcessing(false);
      isProcessingAudioRef.current = false; // Reset processing flag
    }
  }, [language, chatHistory, userPreferences, autoSpeak, enableShortFeedback, conversationId, setChatHistory, setIsProcessing, setShortFeedback, setAiTTSQueued, setIsAnyTTSPlaying, setIsPlayingShortFeedbackTTS]);

  const handlePlayTTS = useCallback(async (text: string, language: string) => {
    try {
      // Check if TTS is already playing globally
      if (isTTSCurrentlyPlaying()) {
        console.log('🔊 [AUDIO_HANDLERS] TTS already playing, stopping current TTS first');
        stopCurrentTTS();
        setIsAnyTTSPlaying(false);
      }
      
      const cacheKey = `manual_tts_${Date.now()}`;
      setIsAnyTTSPlaying(true);
      await playTTSAudio(text, language, cacheKey);
    } catch (error) {
      console.error('Error playing TTS:', error);
      setIsAnyTTSPlaying(false);
    }
  }, [setIsAnyTTSPlaying]);

  const handlePlayExistingTTS = useCallback(async (ttsUrl: string) => {
    try {
      console.log('🔍 [EXISTING_TTS] Attempting to play existing TTS:', ttsUrl);
      
      // Check if TTS is already playing globally and stop it
      if (isTTSCurrentlyPlaying()) {
        console.log('🔊 [EXISTING_TTS] TTS already playing, stopping current TTS first');
        stopCurrentTTS();
        setIsAnyTTSPlaying(false);
      }
      
      // Construct absolute URL using the configuration
      const absoluteUrl = constructTTSUrl(ttsUrl);
      console.log('🔍 [EXISTING_TTS] Constructed absolute URL:', absoluteUrl);
      
      // Check if the URL is accessible before trying to play
      const isAccessible = await isTTSUrlAccessible(ttsUrl);
      if (!isAccessible) {
        throw new Error('TTS file is not accessible');
      }
      
      const audio = new Audio(absoluteUrl);
      setIsAnyTTSPlaying(true);
      
      // Add event listeners for better error handling
      audio.addEventListener('error', (e) => {
        console.error('🔍 [EXISTING_TTS] Audio load error:', e);
        console.warn('🔍 [EXISTING_TTS] Audio file may be corrupted or in unsupported format');
        setIsAnyTTSPlaying(false);
      });
      
      audio.addEventListener('canplaythrough', () => {
        console.log('🔍 [EXISTING_TTS] Audio loaded successfully, playing...');
      });
      
      audio.addEventListener('ended', () => {
        console.log('🔍 [EXISTING_TTS] TTS finished playing');
        setIsAnyTTSPlaying(false);
      });
      
      await audio.play();
      console.log('🔍 [EXISTING_TTS] Successfully playing existing TTS');
      
    } catch (error) {
      console.error('🔍 [EXISTING_TTS] Failed to play existing TTS audio:', error);
      console.warn('🔍 [EXISTING_TTS] The TTS file may be missing, inaccessible, or corrupted');
      setIsAnyTTSPlaying(false);
      
      // Don't try to generate new TTS here as we don't have the original text
      // The user can manually trigger TTS if needed
    }
  }, [setIsAnyTTSPlaying]);

  return {
    isRecording,
    wasInterrupted,
    manualRecording,
    handleStartRecording,
    handleStopRecording,
    handlePlayTTS,
    handlePlayExistingTTS,
    cleanup,
    recognitionRef,
    mediaRecorderRef,
    MediaRecorderClassRef,
    SpeechRecognitionClassRef
  };
};


