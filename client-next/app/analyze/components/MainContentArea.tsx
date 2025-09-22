import React from 'react';

interface MainContentAreaProps {
  isDarkMode: boolean;
  children: React.ReactNode;
}

const MainContentArea: React.FC<MainContentAreaProps> = ({
  isDarkMode,
  children
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
      <div style={{
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
      }}>
        <div style={{
          color: isDarkMode ? '#94a3b8' : '#666',
          fontSize: '0.9rem',
          textAlign: 'center',
          fontStyle: 'italic',
          marginTop: '1rem'
        }}>
          Recording controls will be added here...
        </div>
      </div>
    </>
  );
};

export default MainContentArea;
