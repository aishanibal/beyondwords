import React from 'react';
import RecordingControls from './RecordingControls';

interface MainContentAreaProps {
  isDarkMode: boolean;
  children: React.ReactNode;
  // Recording controls props
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  autoSpeak: boolean;
  setAutoSpeak: (value: boolean) => void;
  enableShortFeedback: boolean;
  setEnableShortFeedback: (value: boolean) => void;
  onEndChat: () => void;
}

const MainContentArea: React.FC<MainContentAreaProps> = ({
  isDarkMode,
  children,
  isRecording,
  onStartRecording,
  onStopRecording,
  autoSpeak,
  setAutoSpeak,
  enableShortFeedback,
  setEnableShortFeedback,
  onEndChat
}) => {
  return (
    <>
      {/* Chat Messages Container */}
      <div style={{
        flex: 1,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        overflowY: 'auto',
        minHeight: 0
      }}>
        {children}
      </div>

      {/* Recording Controls */}
      <RecordingControls
        isDarkMode={isDarkMode}
        isRecording={isRecording}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        autoSpeak={autoSpeak}
        setAutoSpeak={setAutoSpeak}
        enableShortFeedback={enableShortFeedback}
        setEnableShortFeedback={setEnableShortFeedback}
        onEndChat={onEndChat}
      />
    </>
  );
};

export default MainContentArea;


