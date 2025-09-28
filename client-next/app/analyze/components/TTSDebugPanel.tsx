import React from 'react';

interface TTSDebugInfo {
  serviceUsed: string;
  costEstimate: string;
  fallbackReason: string;
  adminSettings: any;
  lastUpdate: Date | null;
}

interface TTSDebugPanelProps {
  ttsDebugInfo: TTSDebugInfo | null;
  setTtsDebugInfo: (info: TTSDebugInfo | null) => void;
  isDarkMode: boolean;
}

const TTSDebugPanel: React.FC<TTSDebugPanelProps> = ({
  ttsDebugInfo,
  setTtsDebugInfo,
  isDarkMode
}) => {
  if (!ttsDebugInfo) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '7rem',
      right: '1rem',
      zIndex: 1000,
      maxWidth: '300px',
      background: isDarkMode 
        ? 'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(51,65,85,0.95) 100%)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,246,244,0.95) 100%)',
      border: isDarkMode ? '1px solid rgba(139,163,217,0.3)' : '1px solid rgba(59,83,119,0.2)',
      borderRadius: '12px',
      boxShadow: isDarkMode 
        ? '0 8px 32px rgba(139,163,217,0.2), 0 2px 8px rgba(139,163,217,0.1)'
        : '0 8px 32px rgba(59,83,119,0.15), 0 2px 8px rgba(59,83,119,0.1)',
      padding: '1rem',
      backdropFilter: 'blur(20px)',
      transition: 'all 0.3s ease',
      fontFamily: 'Montserrat, Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem'
      }}>
        <h3 style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: isDarkMode ? '#e2e8f0' : '#374151',
          margin: 0
        }}>
          🎤 TTS Service Status
        </h3>
        <button
          onClick={() => setTtsDebugInfo(null)}
          style={{
            background: 'none',
            border: 'none',
            color: isDarkMode ? '#94a3b8' : '#6b7280',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0.25rem',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = isDarkMode ? '#e2e8f0' : '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isDarkMode ? '#94a3b8' : '#6b7280';
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            minWidth: '60px'
          }}>
            Service:
          </span>
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            ...(ttsDebugInfo.serviceUsed === 'system' ? {
              background: 'rgba(34,197,94,0.1)',
              color: '#16a34a'
            } : ttsDebugInfo.serviceUsed === 'google_cloud' ? {
              background: 'rgba(59,130,246,0.1)',
              color: '#2563eb'
            } : ttsDebugInfo.serviceUsed === 'gemini' ? {
              background: 'rgba(245,158,11,0.1)',
              color: '#d97706'
            } : ttsDebugInfo.serviceUsed === 'fallback' ? {
              background: 'rgba(239,68,68,0.1)',
              color: '#dc2626'
            } : ttsDebugInfo.serviceUsed === 'cached' ? {
              background: 'rgba(147,51,234,0.1)',
              color: '#9333ea'
            } : {
              background: 'rgba(107,114,128,0.1)',
              color: '#6b7280'
            })
          }}>
            {ttsDebugInfo.serviceUsed === 'system' ? '🖥️ System (FREE)' :
             ttsDebugInfo.serviceUsed === 'google_cloud' ? '☁️ Google Cloud (CHEAP)' :
             ttsDebugInfo.serviceUsed === 'gemini' ? '🤖 Gemini (EXPENSIVE)' :
             ttsDebugInfo.serviceUsed === 'fallback' ? '🔇 Fallback' :
             ttsDebugInfo.serviceUsed === 'cached' ? '💾 Cached' :
             ttsDebugInfo.serviceUsed}
          </span>
        </div>
        
        {ttsDebugInfo.costEstimate !== 'unknown' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              minWidth: '60px'
            }}>
              Cost:
            </span>
            <span style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 600,
              ...(ttsDebugInfo.costEstimate === '0.00' ? {
                background: 'rgba(34,197,94,0.1)',
                color: '#16a34a'
              } : {
                background: 'rgba(245,158,11,0.1)',
                color: '#d97706'
              })
            }}>
              ${ttsDebugInfo.costEstimate}
            </span>
          </div>
        )}
        
        {ttsDebugInfo.fallbackReason !== 'none' && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: isDarkMode ? '#cbd5e1' : '#6b7280',
              minWidth: '60px'
            }}>
              Reason:
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: isDarkMode ? '#94a3b8' : '#6b7280',
              lineHeight: '1.3'
            }}>
              {ttsDebugInfo.fallbackReason}
            </span>
          </div>
        )}
        
        {ttsDebugInfo.lastUpdate && (
          <div style={{
            fontSize: '0.65rem',
            color: isDarkMode ? '#64748b' : '#9ca3af',
            marginTop: '0.25rem',
            textAlign: 'center'
          }}>
            Updated: {ttsDebugInfo.lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TTSDebugPanel;
