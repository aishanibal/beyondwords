import React, { useState, useRef, useCallback } from 'react';

export interface AudioRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  mediaStream: MediaStream | null;
  wasInterrupted: boolean;
  audioChunks: Blob[];
  manualRecording: boolean;
}

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const [manualRecording, setManualRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const interruptedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const autoSpeakRef = useRef(false);

  // Check for MediaRecorder support
  const MediaRecorderClassRef = useRef<typeof MediaRecorder | null>(null);
  const SpeechRecognitionClassRef = useRef<any>(null);

  // Initialize MediaRecorder and SpeechRecognition classes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      MediaRecorderClassRef.current = window.MediaRecorder || (window as any).webkitMediaRecorder;
      SpeechRecognitionClassRef.current = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    }
  }, []);

  const startRecording = useCallback(async (language = 'en-US', isAutoSpeak = false): Promise<boolean> => {
    setWasInterrupted(false);
    autoSpeakRef.current = isAutoSpeak;
    
    if (!MediaRecorderClassRef.current) {
      alert('MediaRecorder API not supported in this browser.');
      return false;
    }
    
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not available in this browser. Please use a modern browser with microphone support.');
      return false;
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
      
      const mediaRecorder = new MediaRecorderClassRef.current(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (interruptedRef.current) {
          interruptedRef.current = false;
          setWasInterrupted(true);
          stream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
          setIsRecording(false);
          setManualRecording(false);
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        // This will be handled by the parent component
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setIsRecording(false);
        setManualRecording(false);
      };
      
      // Start recording with timeslice to get regular audio chunks
      mediaRecorder.start(100); // 100ms timeslice for better audio capture
      setIsRecording(true);
      
      if (isAutoSpeak) {
        // Use SpeechRecognition for silence detection in autospeak mode only
        if (!SpeechRecognitionClassRef.current) {
          alert('SpeechRecognition API not supported in this browser.');
          return false;
        }
        const recognition = new SpeechRecognitionClassRef.current();
        recognitionRef.current = recognition;
        recognition.lang = language || 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;
        
        // Set longer timeout for autospeak mode to give users more time to speak
        if (isAutoSpeak) {
          recognition.maxAlternatives = 1;
          // Note: SpeechRecognition timeout is browser-dependent, but we can add our own timeout
          setTimeout(() => {
            if (recognitionRef.current) {
              console.log('[DEBUG] Autospeak: Speech recognition timeout reached, stopping recording');
              recognitionRef.current.stop();
            }
          }, 10000); // 10 seconds timeout for autospeak mode
        }
        
        recognition.onresult = (event: any) => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
        recognition.onerror = (event: any) => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          alert('Speech recognition error: ' + event.error);
        };
        recognition.onend = () => {
          setIsRecording(false);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        };
        recognition.start();
        setManualRecording(false); // Not manual mode
      } else {
        // Manual mode: no speech recognition, just record until user stops
        setManualRecording(true);
      }
      
      return true;
    } catch (err: any) {
      console.error('Audio recording error:', err);
      let errorMessage = 'Could not start audio recording: ' + err.message;
      
      // Provide more specific error messages
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Audio recording is not supported in this browser. Please use a modern browser.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked for security reasons. Please check your browser settings.';
      }
      
      alert(errorMessage);
      setIsRecording(false);
      setManualRecording(false);
      setMediaStream(null);
      return false;
    }
  }, []);

  const stopRecording = useCallback((interrupted = false) => {
    if (interrupted) {
      interruptedRef.current = true;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    // Only reset manualRecording if we were in manual mode
    if (manualRecording) {
      setManualRecording(false);
    }
  }, [mediaStream, manualRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, [isRecording, isPaused]);

  const getAudioBlob = useCallback((): Blob | null => {
    if (audioChunksRef.current.length === 0) return null;
    return new Blob(audioChunksRef.current, { type: 'audio/webm' });
  }, []);

  const clearRecording = useCallback(() => {
    audioChunksRef.current = [];
    setWasInterrupted(false);
    interruptedRef.current = false;
  }, []);

  return {
    isRecording,
    isPaused,
    mediaStream,
    wasInterrupted,
    manualRecording,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getAudioBlob,
    clearRecording,
  };
}
