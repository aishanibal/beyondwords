import React from 'react';
import { motion } from 'framer-motion';

interface RecordingControlsProps {
  isDarkMode: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  autoSpeak: boolean;
  setAutoSpeak: (value: boolean) => void;
  enableShortFeedback: boolean;
  setEnableShortFeedback: (value: boolean) => void;
  onEndChat: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isDarkMode,
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording,
  autoSpeak,
  setAutoSpeak,
  enableShortFeedback,
  setEnableShortFeedback,
  onEndChat
}) => {
  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        background: isDarkMode
          ? 'linear-gradient(135deg, var(--muted) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(195,141,148,0.08) 0%, rgba(195,141,148,0.03) 100%)',
        borderTop: isDarkMode ? '1px solid var(--border)' : '1px solid #e0e0e0',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        zIndex: 10,
        flexShrink: 0,
        height: '120px',
        position: 'sticky',
        bottom: 0
      }}
    >
      {/* Main controls layout */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '60px'
      }}>
        {/* Left side - Autospeak and Short Feedback buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 1
        }}>
          {/* Autospeak Toggle Button */}
          <motion.button
            onClick={() => setAutoSpeak(!autoSpeak)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: autoSpeak 
                ? 'linear-gradient(135deg, var(--blue-secondary) 0%, #5a6b8a 100%)' 
                : 'linear-gradient(135deg, var(--blue-secondary) 0%, #5a6b8a 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '0.6rem 1rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 24px rgba(60,76,115,0.25), 0 2px 8px rgba(60,76,115,0.15)',
              minWidth: '110px',
              fontFamily: 'Montserrat, Arial, sans-serif',
              transform: 'translateZ(0)'
            }}
          >
            {autoSpeak ? '✅ Autospeak ON' : 'Autospeak OFF'}
          </motion.button>

          {/* Short Feedback Toggle Button */}
          <motion.button
            onClick={() => setEnableShortFeedback(!enableShortFeedback)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: enableShortFeedback 
                ? 'linear-gradient(135deg, var(--blue-secondary) 0%, #5a6b8a 100%)' 
                : 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '0.6rem 1rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 24px rgba(60,76,115,0.25), 0 2px 8px rgba(60,76,115,0.15)',
              minWidth: '110px',
              fontFamily: 'Montserrat, Arial, sans-serif',
              transform: 'translateZ(0)'
            }}
          >
            {enableShortFeedback ? '💡 Short Feedback ON' : 'Short Feedback OFF'}
          </motion.button>
        </div>

        {/* Center - Microphone Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          flex: 1
        }}>
          <motion.button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isProcessing}
            whileHover={{ scale: isProcessing ? 1 : 1.05 }}
            whileTap={{ scale: isProcessing ? 1 : 0.95 }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: 'none',
              background: isRecording 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
              color: '#fff',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: isRecording 
                ? '0 8px 32px rgba(239,68,68,0.4), 0 4px 16px rgba(239,68,68,0.2)'
                : '0 8px 32px rgba(195,141,148,0.4), 0 4px 16px rgba(195,141,148,0.2)',
              opacity: isProcessing ? 0.6 : 1,
              transform: 'translateZ(0)'
            }}
          >
            {isProcessing ? '⏳' : isRecording ? '⏹️' : '🎤'}
          </motion.button>
        </div>

        {/* Right side - End Chat button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 1,
          justifyContent: 'flex-end'
        }}>
          <motion.button
            onClick={onEndChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '0.6rem 1rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 24px rgba(60,76,115,0.25), 0 2px 8px rgba(60,76,115,0.15)',
              minWidth: '110px',
              fontFamily: 'Montserrat, Arial, sans-serif',
              transform: 'translateZ(0)'
            }}
            title="End chat, generate summary, and return to dashboard"
          >
            🏠 End Chat
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default RecordingControls;
