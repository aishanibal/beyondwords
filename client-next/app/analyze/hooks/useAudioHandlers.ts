import { useRef, useState, useCallback } from 'react';
import { processAudioWithPipeline } from '../services/audioService';
import { saveMessageToBackend } from '../services/conversationService';
import { playTTSAudio, getTTSText } from '../services/audioService';
import { ChatMessage } from '../types/analyze';
import { TTS_TIMEOUTS } from '../config/constants';

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
  setIsPlayingShortFeedbackTTS: React.Dispatch<React.SetStateAction<boolean>>
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
        console.log('🔍 [DEBUG] audioChunksRef.current length:', audioChunksRef.current.length);
        console.log('🔍 [DEBUG] Total audio chunks size:', audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0), 'bytes');
        
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
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('🔍 [DEBUG] Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: audioChunksRef.current.length,
          mimeType: mimeType
        });
        sendAudioToBackend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setIsRecording(false);
        setManualRecording(false);
      };
      
      // Start recording with timeslice to get regular audio chunks
      mediaRecorder.start(100); // 100ms timeslice for better audio capture
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

  const handleStopRecording = useCallback((isManualStop: boolean = true) => {
    if (isManualStop) {
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
      const result = await processAudioWithPipeline(
        audioBlob,
        language,
        chatHistory,
        userPreferences,
        autoSpeak,
        enableShortFeedback
      );
      
      // Replace the placeholder message with the actual transcript
      setChatHistory(prev => {
        const updated = prev.map((msg, index) => {
          if (msg.isProcessing && msg.sender === 'User') {
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
      
      // Show short feedback if available and play TTS automatically
      if (result.shortFeedback) {
        setShortFeedback(result.shortFeedback);
        
        // Play short feedback TTS immediately for all modes
        const cacheKey = `short_feedback_${Date.now()}`;
        console.log('[DEBUG] Playing short feedback TTS immediately');
        setIsPlayingShortFeedbackTTS(true);
        playTTSAudio(result.shortFeedback, language, cacheKey).then(() => {
          console.log('[DEBUG] Short feedback TTS finished');
          setIsPlayingShortFeedbackTTS(false);
        }).catch(error => {
          console.error('[DEBUG] Error playing short feedback TTS:', error);
          setIsPlayingShortFeedbackTTS(false);
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

  const handlePlayTTS = useCallback(async (text: string, language: string) => {
    try {
      const cacheKey = `manual_tts_${Date.now()}`;
      await playTTSAudio(text, language, cacheKey);
    } catch (error) {
      console.error('Error playing TTS:', error);
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
    handlePlayTTS,
    handlePlayExistingTTS,
    recognitionRef,
    mediaRecorderRef,
    MediaRecorderClassRef,
    SpeechRecognitionClassRef
  };
};


