import React from 'react';

interface AudioControlsProps {
  onStartRecording: () => Promise<void>;
  onStopRecording: () => void;
  onAudioRecorded: (audioBlob: Blob) => void;
  isRecording: boolean;
  isPaused: boolean;
  wasInterrupted: boolean;
  isDarkMode: boolean;
  disabled?: boolean;
}

export default function AudioControls({ 
  onStartRecording,
  onStopRecording,
  onAudioRecorded, 
  isRecording,
  isPaused,
  wasInterrupted,
  isDarkMode, 
  disabled = false 
}: AudioControlsProps) {

  const handleStartRecording = async () => {
    await onStartRecording();
  };

  const handleStopRecording = () => {
    onStopRecording();
  };

  const handlePauseRecording = () => {
    // Pause/resume functionality can be added later if needed
    console.log('Pause/resume not implemented yet');
  };

  return (
    <div className="flex items-center space-x-2">
      {!isRecording ? (
        <button
          onClick={handleStartRecording}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDarkMode
              ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
          }`}
        >
          🎤 Start Recording
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePauseRecording}
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button
            onClick={handleStopRecording}
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            ⏹️ Stop
          </button>
        </div>
      )}
      
      {isRecording && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isPaused ? 'Paused' : 'Recording...'}
          </span>
        </div>
      )}
    </div>
  );
}
