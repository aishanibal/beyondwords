import React from 'react';

interface FloatingPanelToggleProps {
  showShortFeedbackPanel: boolean;
  setShowShortFeedbackPanel: (show: boolean) => void;
}

const FloatingPanelToggle: React.FC<FloatingPanelToggleProps> = ({
  showShortFeedbackPanel,
  setShowShortFeedbackPanel
}) => {
  if (showShortFeedbackPanel) return null;

  return (
    <button
      onClick={() => setShowShortFeedbackPanel(true)}
      style={{
        position: 'fixed',
        left: '1rem',
        top: '6.7rem',
        background: 'var(--blue-secondary)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px 0 0 12px',
        padding: '1.1rem 0.75rem',
        fontSize: '1.2rem',
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 16px rgba(60,76,115,0.25)',
        zIndex: 1000,
        fontFamily: 'Montserrat, Arial, sans-serif',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      title="Show Short Feedback Panel"
    >
      💡
    </button>
  );
};

export default FloatingPanelToggle;

