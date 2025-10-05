import React from 'react';

interface AnalyzeLayoutProps {
  isDarkMode: boolean;
  panelWidths: { left: number; center: number; right: number };
  showShortFeedbackPanel: boolean;
  setShowShortFeedbackPanel: (show: boolean) => void;
  ttsDebugInfo: any;
  setTtsDebugInfo: (info: any) => void;
  romanizationDebugInfo: any;
  setRomanizationDebugInfo: (info: any) => void;
  translations: Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>;
  showTranslations: Record<number, boolean>;
  feedbackExplanations: Record<number, Record<string, string>>;
  showDetailedBreakdown: Record<number, boolean>;
  setShowDetailedBreakdown: (breakdown: Record<number, boolean>) => void;
  parsedBreakdown: any[];
  activePopup: { messageIndex: number; wordKey: string; position: { x: number; y: number } } | null;
  // Left panel content props
  shortFeedback: string;
  quickTranslations: Record<number, { fullTranslation: string; wordTranslations: Record<string, string>; romanized: string; error: boolean; generatedWords?: string[]; generatedScriptWords?: string[] }>;
  showQuickTranslation: boolean;
  setShowQuickTranslation: (show: boolean) => void;
  llmBreakdown: string;
  showLlmBreakdown: boolean;
  setShowLlmBreakdown: (show: boolean) => void;
  chatHistory: any[];
  isLoadingMessageFeedback: Record<number, boolean>;
  isLoadingExplain: boolean;
  explainLLMResponse: (messageIndex: number, text: string) => void;
  renderClickableMessage: (message: any, messageIndex: number, translation: any) => React.ReactNode;
  children: React.ReactNode;
}

const AnalyzeLayout: React.FC<AnalyzeLayoutProps> = ({
  isDarkMode,
  panelWidths,
  showShortFeedbackPanel,
  setShowShortFeedbackPanel,
  ttsDebugInfo,
  setTtsDebugInfo,
  romanizationDebugInfo,
  setRomanizationDebugInfo,
  translations,
  showTranslations,
  feedbackExplanations,
  showDetailedBreakdown,
  setShowDetailedBreakdown,
  parsedBreakdown,
  activePopup,
  // Left panel content props
  shortFeedback,
  quickTranslations,
  showQuickTranslation,
  setShowQuickTranslation,
  llmBreakdown,
  showLlmBreakdown,
  setShowLlmBreakdown,
  chatHistory,
  isLoadingMessageFeedback,
  isLoadingExplain,
  explainLLMResponse,
  renderClickableMessage,
  children
}) => {
  return (
    <div className="analyze-page" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: 'calc(100vh - 5rem)', 
      width: '100%',
      background: isDarkMode 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        : 'linear-gradient(135deg, #f9f6f4 0%, #f5f1ec 50%, #e8e0d8 100%)',
      padding: '0.5rem 0.5rem 0 0.5rem',
      gap: '0.5rem',
      transition: 'all 0.15s ease',
      fontFamily: 'Montserrat, Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* TTS Debug Panel */}
      {false && ttsDebugInfo && (
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
      )}
      
      {/* Romanization Debug Panel */}
      {false && romanizationDebugInfo && (
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
              📝 Romanization Status
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
                Service:
              </span>
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                ...(romanizationDebugInfo.fallbackUsed ? {
                  background: 'rgba(239,68,68,0.1)',
                  color: '#dc2626'
                } : {
                  background: 'rgba(34,197,94,0.1)',
                  color: '#16a34a'
                })
              }}>
                {romanizationDebugInfo.fallbackUsed ? '⚠️ Fallback' : '✅ Kuroshiro'}
              </span>
            </div>
            
            {romanizationDebugInfo.fallbackReason && (
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
                  {romanizationDebugInfo.fallbackReason}
                </span>
              </div>
            )}
            
            {romanizationDebugInfo.lastUpdate && (
              <div style={{
                fontSize: '0.65rem',
                color: isDarkMode ? '#64748b' : '#9ca3af',
                marginTop: '0.25rem',
                textAlign: 'center'
              }}>
                Updated: {romanizationDebugInfo.lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panels Container */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: '0.5rem',
        minHeight: 0
      }}>
        {/* Left Panel - Short Feedback Panel */}
        {showShortFeedbackPanel && (
          <div className="panel-hover" style={{ 
            width: `${panelWidths.left * 100}%`, 
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
            {/* AI Explanations Header */}
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
                : '0 4px 16px rgba(59,83,119,0.15)',
              position: 'sticky',
              top: 0,
              zIndex: 2
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: '0.2rem',
                paddingRight: '0.2rem',
                paddingTop: '0.25rem',
                paddingBottom: '0.25rem',
                width: '100%'
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
                  💡 AI Explanations
                </div>
                <button
                  onClick={() => setShowShortFeedbackPanel(false)}
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
                  ◀
                </button>
              </div>
            </div>
            
            {/* Resize Handle */}
            <div
              onMouseDown={() => {/* Handle resize */}}
              style={{
                position: 'absolute',
                right: -4,
                top: 0,
                bottom: 0,
                width: 8,
                cursor: 'col-resize',
                background: 'transparent',
                zIndex: 10
              }}
            />
            
            {/* Short Feedback Content (scrollable body) */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflowY: 'auto'
            }}>
              
              {/* Quick Translation Section */}
              {Object.keys(quickTranslations).length > 0 && (
                <div style={{
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(132,84,109,0.15) 0%, rgba(132,84,109,0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(132,84,109,0.12) 0%, rgba(132,84,109,0.06) 100%)',
                  color: isDarkMode ? 'var(--foreground)' : '#3e3e3e',
                  padding: '1rem',
                  borderBottom: isDarkMode ? '1px solid rgba(195,141,148,0.3)' : '1px solid #c38d94',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  fontFamily: 'AR One Sans, Arial, sans-serif',
                  fontWeight: 400,
                  transition: 'background 0.3s ease, color 0.3s ease'
                }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    marginBottom: showQuickTranslation ? '1rem' : '0',
                    color: isDarkMode ? '#84546d' : '#84546d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>Quick Translation</span>
                      {showLlmBreakdown && (
                        <button
                          onClick={() => setShowQuickTranslation(!showQuickTranslation)}
                          style={{
                            padding: '0.15rem 0.4rem',
                            borderRadius: 3,
                            border: '1px solid #666',
                            background: 'rgba(102,102,102,0.1)',
                            color: '#666',
                            fontSize: '0.6rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title={showQuickTranslation ? 'Collapse' : 'Expand'}
                        >
                          {showQuickTranslation ? '▼' : '▶'}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        // Find the most recent AI message in chat history
                        let mostRecentAIMessageIndex = -1;
                        for (let i = chatHistory.length - 1; i >= 0; i--) {
                          if (chatHistory[i] && chatHistory[i].sender === 'AI') {
                            mostRecentAIMessageIndex = i;
                            break;
                          }
                        }
                        
                        if (mostRecentAIMessageIndex >= 0) {
                          const message = chatHistory[mostRecentAIMessageIndex];
                          if (message) {
                            explainLLMResponse(mostRecentAIMessageIndex, message.text);
                          }
                        }
                      }}
                      disabled={isLoadingExplain}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: 6,
                        border: `1px solid ${isDarkMode ? 'rgba(139,163,217,0.6)' : '#3b5377'}`,
                        background: isDarkMode 
                          ? 'rgba(139,163,217,0.15)' 
                          : 'rgba(59,83,119,0.08)',
                        color: isDarkMode ? '#8ba3d9' : '#3b5377',
                        fontSize: '0.7rem',
                        cursor: isLoadingExplain ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isLoadingExplain ? 0.6 : 1,
                        fontWeight: 500,
                        boxShadow: isDarkMode 
                          ? '0 1px 3px rgba(139,163,217,0.10)' 
                          : '0 1px 3px rgba(59,83,119,0.10)'
                      }}
                      title="Get detailed LLM breakdown"
                    >
                      {isLoadingExplain ? '🔄 Explaining...' : '📝 Detailed Explanation'}
                    </button>
                  </div>
                  {showQuickTranslation && (
                    <div style={{
                      maxHeight: showLlmBreakdown ? '200px' : 'none',
                      overflowY: showLlmBreakdown ? 'auto' : 'visible'
                    }}>
                      {Object.entries(quickTranslations).map(([messageIndex, translation]) => (
                        <div key={messageIndex} style={{ marginBottom: '1rem' }}>
                          {translation.error ? (
                            <div style={{ color: '#dc3545', fontStyle: 'italic' }}>
                              {translation.fullTranslation}
                            </div>
                          ) : (
                            <div>
                              {/* Word by word breakdown with clickable words */}
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong>Word by Word Breakdown:</strong>
                                <div style={{
                                  background: isDarkMode ? '#334155' : '#f8f9fa',
                                  padding: '0.75rem',
                                  borderRadius: 8,
                                  marginTop: '0.5rem',
                                  fontSize: '0.95rem',
                                  lineHeight: '1.6',
                                  maxHeight: showLlmBreakdown ? '120px' : 'none',
                                  overflowY: showLlmBreakdown ? 'auto' : 'visible'
                                }}>
                                  {renderClickableMessage(chatHistory[parseInt(messageIndex)], parseInt(messageIndex), translation)}
                                </div>
                              </div>
                              
                              {/* Full translation */}
                              {translation.fullTranslation && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                  <strong>Translation:</strong>
                                  <div style={{
                                    background: isDarkMode ? '#334155' : '#f8f9fa',
                                    padding: '0.75rem',
                                    borderRadius: 8,
                                    marginTop: '0.5rem',
                                    fontSize: '0.85rem',
                                    lineHeight: '1.6'
                                  }}>
                                    {translation.fullTranslation}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* LLM Response Breakdown Section */}
              {showLlmBreakdown && llmBreakdown && (
                <div style={{
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(60,76,115,0.15) 0%, rgba(60,76,115,0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(60,76,115,0.12) 0%, rgba(60,76,115,0.06) 100%)',
                  color: isDarkMode ? 'var(--foreground)' : '#3e3e3e',
                  padding: '1rem',
                  borderBottom: isDarkMode ? '1px solid rgba(139,163,217,0.3)' : '1px solid #3b5377',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  fontFamily: 'AR One Sans, Arial, sans-serif',
                  fontWeight: 400,
                  transition: 'background 0.3s ease, color 0.3s ease'
                }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    marginBottom: '1rem',
                    color: isDarkMode ? '#3b5377' : '#3b5377',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>LLM Response Breakdown</span>
                    <button
                      onClick={() => setShowLlmBreakdown(false)}
                      style={{
                        padding: '0.15rem 0.4rem',
                        borderRadius: 3,
                        border: '1px solid #666',
                        background: 'rgba(102,102,102,0.1)',
                        color: '#666',
                        fontSize: '0.6rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="Hide breakdown"
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{
                    background: isDarkMode ? '#334155' : '#f8f9fa',
                    padding: '0.75rem',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {llmBreakdown}
                  </div>
                </div>
              )}
              
              
              {/* Default message when no content */}
              {!shortFeedback && Object.keys(quickTranslations).length === 0 && !showLlmBreakdown && (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  color: isDarkMode ? '#94a3b8' : '#666',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  <div>
                    💡 Click on any AI message to see explanations and feedback here
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Panel - Center */}
        <div style={{ 
          width: `${panelWidths.center * 100}%`,
          background: isDarkMode 
            ? 'linear-gradient(135deg, var(--card) 0%, rgba(255,255,255,0.02) 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, rgba(195,141,148,0.02) 100%)', 
          borderRadius: 24, 
          display: 'flex', 
          flexDirection: 'column', 
          boxShadow: isDarkMode 
            ? '0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)' 
            : '0 8px 40px rgba(60,60,60,0.12), 0 2px 8px rgba(195,141,148,0.08)',
          position: 'relative', 
          transition: 'all 0.3s ease',
          border: isDarkMode ? '1px solid var(--rose-primary)' : '1px solid var(--rose-primary)',
          backdropFilter: 'blur(20px)',
          zIndex: 1,
          minHeight: 0,
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Main Content - Children will be rendered here */}
          {children}
        </div>


      {/* Floating Panel Toggle Buttons */}
      {!showShortFeedbackPanel && (
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
      )}

      </div>
    </div>
  );
};

export default AnalyzeLayout;
