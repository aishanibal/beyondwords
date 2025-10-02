import React from 'react';

interface InterruptMessageProps {
  wasInterrupted: boolean;
  isRecording: boolean;
}

const InterruptMessage: React.FC<InterruptMessageProps> = ({
  wasInterrupted,
  isRecording
}) => {
  if (!wasInterrupted || isRecording) return null;

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      right: 0,
      top: 80,
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      <div style={{
        background: '#fff7e6',
        color: '#e67e22',
        border: '2px solid #e67e22',
        borderRadius: 12,
        padding: '1rem 2rem',
        fontWeight: 700,
        fontSize: '1.1rem',
        boxShadow: '0 2px 12px rgba(230,126,34,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        pointerEvents: 'auto'
      }}>
        <span style={{ fontSize: '1.5rem' }}>⏹️</span>
        Recording canceled. You can try again.
      </div>
    </div>
  );
};

export default InterruptMessage;

