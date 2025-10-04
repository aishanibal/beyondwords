import React from 'react';

interface RomanizationDebugInfo {
  method: string;
  language: string;
  originalText: string;
  romanizedText: string;
  fallbackUsed: boolean;
  fallbackReason: string;
  textAnalysis: {
    hasKanji: boolean;
    hasHiragana: boolean;
    hasKatakana: boolean;
    isPureKana: boolean;
  };
  processingTime: number;
  lastUpdate: Date | null;
}

interface RomanizationDebugPanelProps {
  romanizationDebugInfo: RomanizationDebugInfo | null;
  setRomanizationDebugInfo: (info: RomanizationDebugInfo | null) => void;
  isDarkMode: boolean;
}

const RomanizationDebugPanel: React.FC<RomanizationDebugPanelProps> = ({
  romanizationDebugInfo,
  setRomanizationDebugInfo,
  isDarkMode
}) => {
  if (!romanizationDebugInfo) return null;

  return (
    <div style={{
      position: 'fixed',
      top: romanizationDebugInfo.fallbackUsed ? '12rem' : '7rem',
      right: '1rem',
      zIndex: 1000,
      maxWidth: '350px',
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
          🔤 Romanization Status
        </h3>
        <button
          onClick={() => setRomanizationDebugInfo(null)}
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
            Method:
          </span>
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            ...(romanizationDebugInfo.method === 'kuroshiro' ? {
              background: 'rgba(34,197,94,0.1)',
              color: '#16a34a'
            } : romanizationDebugInfo.method === 'wanakana' ? {
              background: 'rgba(59,130,246,0.1)',
              color: '#2563eb'
            } : romanizationDebugInfo.method === 'pinyin' ? {
              background: 'rgba(245,158,11,0.1)',
              color: '#d97706'
            } : romanizationDebugInfo.method === 'transliteration' ? {
              background: 'rgba(147,51,234,0.1)',
              color: '#9333ea'
            } : {
              background: 'rgba(107,114,128,0.1)',
              color: '#6b7280'
            })
          }}>
            {romanizationDebugInfo.method === 'kuroshiro' ? '🎯 Kuroshiro (Best)' :
             romanizationDebugInfo.method === 'wanakana' ? '⚡ Wanakana (Fast)' :
             romanizationDebugInfo.method === 'pinyin' ? '📝 Pinyin (Chinese)' :
             romanizationDebugInfo.method === 'transliteration' ? '🔄 Transliteration' :
             romanizationDebugInfo.method === 'unidecode' ? '🔧 Unidecode' :
             romanizationDebugInfo.method}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            minWidth: '60px'
          }}>
            Language:
          </span>
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: 'rgba(59,130,246,0.1)',
            color: '#2563eb'
          }}>
            {romanizationDebugInfo.language.toUpperCase()}
          </span>
        </div>
        
        {romanizationDebugInfo.originalText && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                minWidth: '60px'
              }}>
                Original:
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                fontFamily: 'monospace'
              }}>
                {romanizationDebugInfo.originalText}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                minWidth: '60px'
              }}>
                Romanized:
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: isDarkMode ? '#e2e8f0' : '#374151',
                fontFamily: 'monospace'
              }}>
                {romanizationDebugInfo.romanizedText}
              </span>
            </div>
          </div>
        )}
        
        {romanizationDebugInfo.fallbackUsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                minWidth: '60px'
              }}>
                Status:
              </span>
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                background: 'rgba(245,158,11,0.1)',
                color: '#d97706'
              }}>
                ⚠️ Fallback Used
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                minWidth: '60px'
              }}>
                Reason:
              </span>
              <span style={{
                fontSize: '0.65rem',
                color: isDarkMode ? '#94a3b8' : '#6b7280',
                lineHeight: '1.3'
              }}>
                {romanizationDebugInfo.fallbackReason}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color: isDarkMode ? '#cbd5e1' : '#6b7280',
                minWidth: '60px'
              }}>
                Text:
              </span>
              <span style={{
                fontSize: '0.65rem',
                color: isDarkMode ? '#94a3b8' : '#6b7280',
                lineHeight: '1.3'
              }}>
                {romanizationDebugInfo.textAnalysis.hasKanji ? '漢字' : ''}
                {romanizationDebugInfo.textAnalysis.hasHiragana ? ' ひらがな' : ''}
                {romanizationDebugInfo.textAnalysis.hasKatakana ? ' カタカナ' : ''}
                {romanizationDebugInfo.textAnalysis.isPureKana ? ' (Pure Kana)' : ''}
              </span>
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: isDarkMode ? '#cbd5e1' : '#6b7280',
            minWidth: '60px'
          }}>
            Speed:
          </span>
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: 'rgba(34,197,94,0.1)',
            color: '#16a34a'
          }}>
            {romanizationDebugInfo.processingTime.toFixed(1)}ms
          </span>
        </div>
        
        <div style={{
          fontSize: '0.65rem',
          color: isDarkMode ? '#64748b' : '#9ca3af',
          marginTop: '0.25rem',
          textAlign: 'center'
        }}>
          Updated: {romanizationDebugInfo.lastUpdate?.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default RomanizationDebugPanel;
