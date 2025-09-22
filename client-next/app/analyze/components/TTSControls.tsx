import React from 'react';
import { useTTS } from '../hooks/useTTS';

interface TTSControlsProps {
  text: string;
  language: string;
  isDarkMode: boolean;
  disabled?: boolean;
}

export default function TTSControls({ 
  text, 
  language, 
  isDarkMode, 
  disabled = false 
}: TTSControlsProps) {
  const { 
    isPlaying, 
    currentPlayingText, 
    playTTSAudio, 
    stopTTS 
  } = useTTS();

  const handlePlayTTS = () => {
    if (isPlaying) {
      stopTTS();
    } else {
      playTTSAudio(text, language, `${language}_${text.substring(0, 50)}`);
    }
  };

  const isCurrentText = currentPlayingText === text;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handlePlayTTS}
        disabled={disabled || !text.trim()}
        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
          isDarkMode
            ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
        }`}
      >
        {isPlaying && isCurrentText ? '⏸️ Pause' : '🔊 Play'}
      </button>
      
      {isPlaying && isCurrentText && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Playing...
          </span>
        </div>
      )}
    </div>
  );
}
