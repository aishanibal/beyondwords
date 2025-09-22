import React from 'react';

interface RightPanelProps {
  isDarkMode: boolean;
  rightPanelWidth: number;
  showRightPanel: boolean;
  onClose: () => void;
  translations: Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>;
  showTranslations: Record<number, boolean>;
  feedbackExplanations: Record<number, Record<string, string>>;
  showDetailedBreakdown: Record<number, boolean>;
  parsedBreakdown: any[];
  activePopup: { messageIndex: number; wordKey: string; position: { x: number; y: number } } | null;
}

const RightPanel: React.FC<RightPanelProps> = ({
  isDarkMode,
  rightPanelWidth,
  showRightPanel,
  onClose,
  translations,
  showTranslations,
  feedbackExplanations,
  showDetailedBreakdown,
  parsedBreakdown,
  activePopup
}) => {
  if (!showRightPanel) return null;

  return (
    <div style={{
      width: `${rightPanelWidth}px`,
      background: isDarkMode 
        ? 'linear-gradient(135deg, var(--card) 0%, rgba(255,255,255,0.02) 100%)' 
        : 'linear-gradient(135deg, #ffffff 0%, rgba(59,83,119,0.02) 100%)', 
      borderRadius: 24,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isDarkMode 
        ? '0 8px 32px rgba(139,163,217,0.2), 0 2px 8px rgba(139,163,217,0.1)' 
        : '0 8px 32px rgba(59,83,119,0.25), 0 2px 8px rgba(59,83,119,0.15)',
      position: 'relative',
      transition: 'all 0.15s ease',
      border: isDarkMode ? '1px solid rgba(139,163,217,0.3)' : '1px solid #3b5377',
      backdropFilter: 'blur(20px)',
      zIndex: 1,
      overflow: 'hidden',
      height: '100%'
    }}>
      {/* Header */}
      <div style={{ 
        background: isDarkMode 
          ? 'linear-gradient(135deg, #3b5377 0%, #2a3d5a 100%)' 
          : 'linear-gradient(135deg, #3b5377 0%, #2a3d5a 100%)', 
        color: '#ffffff', 
        padding: '0.75rem 1.25rem', 
        borderRadius: '24px 24px 0 0',
        textAlign: 'center',
        borderBottom: isDarkMode ? '1px solid rgba(139,163,217,0.3)' : '1px solid #3b5377',
        fontFamily: 'Gabriela, Arial, sans-serif',
        fontWeight: 700,
        fontSize: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.3s ease',
        boxShadow: isDarkMode 
          ? '0 4px 16px rgba(139,163,217,0.2)' 
          : '0 4px 16px rgba(59,83,119,0.15)'
      }}>
        <div style={{ 
          color: '#ffffff', 
          fontWeight: 700, 
          fontSize: '1.2rem', 
          fontFamily: 'Gabriela, Arial, sans-serif',
          transition: 'color 0.3s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          📚 Translations & Feedback
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '1.1rem',
            cursor: 'pointer',
            padding: '0.2rem',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          title="Hide panel"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Translations Section */}
        <div>
          <h3 style={{
            color: isDarkMode ? '#e2e8f0' : '#374151',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            fontFamily: 'Montserrat, Arial, sans-serif'
          }}>
            🔤 Translations
          </h3>
          <div style={{
            fontSize: '0.8rem',
            color: isDarkMode ? '#94a3b8' : '#6b7280',
            fontStyle: 'italic'
          }}>
            Click on any message to see its translation here
          </div>
        </div>

        {/* Feedback Section */}
        <div>
          <h3 style={{
            color: isDarkMode ? '#e2e8f0' : '#374151',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            fontFamily: 'Montserrat, Arial, sans-serif'
          }}>
            💡 Feedback
          </h3>
          <div style={{
            fontSize: '0.8rem',
            color: isDarkMode ? '#94a3b8' : '#6b7280',
            fontStyle: 'italic'
          }}>
            Detailed feedback will appear here when requested
          </div>
        </div>

        {/* Active Popup Info */}
        {activePopup && (
          <div style={{
            background: isDarkMode ? 'rgba(139,163,217,0.1)' : 'rgba(59,83,119,0.1)',
            borderRadius: '8px',
            padding: '0.75rem',
            border: isDarkMode ? '1px solid rgba(139,163,217,0.3)' : '1px solid rgba(59,83,119,0.2)'
          }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: isDarkMode ? '#8ba3d9' : '#3b5377',
              marginBottom: '0.25rem'
            }}>
              Selected Word
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: isDarkMode ? '#e2e8f0' : '#374151'
            }}>
              {activePopup.wordKey}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
