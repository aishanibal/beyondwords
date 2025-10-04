import React from 'react';

interface ActivePopup {
  messageIndex: number;
  wordKey: string;
  position: { x: number; y: number };
}

interface WordExplanationPopupProps {
  activePopup: ActivePopup | null;
  quickTranslations: Record<number, any>;
  feedbackExplanations: Record<number, Record<string, string>>;
  isDarkMode: boolean;
}

const WordExplanationPopup: React.FC<WordExplanationPopupProps> = ({
  activePopup,
  quickTranslations,
  feedbackExplanations,
  isDarkMode
}) => {
  if (!activePopup) return null;

  return (
    <div
      data-popup="true"
      style={{
        position: 'fixed',
        left: Math.max(10, Math.min(window.innerWidth - 320, activePopup.position.x)),
        top: Math.max(10, activePopup.position.y - 60),
        transform: 'translateX(-50%)',
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
        border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        maxWidth: '300px',
        fontSize: '14px',
        lineHeight: '1.4',
        color: isDarkMode ? '#e2e8f0' : '#1e293b',
        pointerEvents: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontWeight: 400, marginBottom: '4px', color: isDarkMode ? '#cbd5e1' : '#475569', fontSize: '13px' }}>
        {activePopup.wordKey.replace(/[__~~==<<>>]/g, '')}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>
        {(() => {
          const translation = quickTranslations[activePopup.messageIndex]?.wordTranslations[activePopup.wordKey];
          console.log('Popup translation lookup:', { 
            messageIndex: activePopup.messageIndex, 
            wordKey: activePopup.wordKey, 
            translation, 
            allTranslations: quickTranslations[activePopup.messageIndex]?.wordTranslations,
            availableKeys: Object.keys(quickTranslations[activePopup.messageIndex]?.wordTranslations || {})
          });
          return translation || feedbackExplanations[activePopup.messageIndex]?.[activePopup.wordKey] || 'No translation available';
        })()}
      </div>
      {/* Arrow pointing down to the word */}
      <div
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `6px solid ${isDarkMode ? '#1e293b' : '#ffffff'}`,
          filter: `drop-shadow(0 1px 1px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'})`
        }}
      />
    </div>
  );
};

export default WordExplanationPopup;

