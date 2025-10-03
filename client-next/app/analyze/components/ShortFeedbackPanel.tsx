import React from 'react';
import { motion } from 'framer-motion';
import { LEARNING_GOALS, LearningGoal } from '../../../lib/preferences';

interface ShortFeedbackPanelProps {
  showShortFeedbackPanel: boolean;
  setShowShortFeedbackPanel: (show: boolean) => void;
  leftPanelWidth: number;
  isDarkMode: boolean;
  shortFeedback: string;
  quickTranslations: Record<number, any>;
  showQuickTranslation: boolean;
  setShowQuickTranslation: (show: boolean) => void;
  llmBreakdown: string;
  showLlmBreakdown: boolean;
  setShowLlmBreakdown: (show: boolean) => void;
  chatHistory: any[];
  isLoadingMessageFeedback: Record<number, boolean>;
  isLoadingExplain: boolean;
  explainLLMResponse: (messageIndex: number, text: string) => Promise<void>;
  renderClickableMessage: (message: any, messageIndex: number, translation: any) => React.ReactNode;
  parsedBreakdown: any[];
  isGeneratingTTS: Record<string, boolean>;
  isPlayingTTS: Record<string, boolean>;
  playTTSAudio: (text: string, language: string, cacheKey: string) => Promise<void>;
  language: string;
  userPreferences: any;
  handleLeftResizeStart: (e: React.MouseEvent) => void;
}

const ShortFeedbackPanel: React.FC<ShortFeedbackPanelProps> = ({
  showShortFeedbackPanel,
  setShowShortFeedbackPanel,
  leftPanelWidth,
  isDarkMode,
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
  parsedBreakdown,
  isGeneratingTTS,
  isPlayingTTS,
  playTTSAudio,
  language,
  userPreferences,
  handleLeftResizeStart
}) => {
  if (!showShortFeedbackPanel) return null;

  return (
    <div className="panel-hover" style={{ 
      width: `${leftPanelWidth * 100}%`, 
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
          : '0 4px 16px rgba(59,83,119,0.15)'
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
        onMouseDown={handleLeftResizeStart}
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
      
      {/* Short Feedback Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
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
                {isLoadingExplain ? '🔄' : '📝 Detailed Explanation'}
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
            background: isDarkMode ? '#1e293b' : '#fff',
            color: isDarkMode ? '#f8fafc' : '#000',
            padding: '1rem',
            borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #ececec',
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
              color: isDarkMode ? '#f8fafc' : '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📝 Detailed Breakdown
              </span>
              <button
                onClick={() => setShowLlmBreakdown(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDarkMode ? '#94a3b8' : '#666',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.2rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title="Close breakdown"
              >
                ×
              </button>
            </div>
            <div style={{
              background: isDarkMode ? '#334155' : '#f8f9fa',
              padding: '0.75rem',
              borderRadius: 8,
              fontSize: '0.85rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {llmBreakdown}
            </div>
          </div>
        )}
        
        {shortFeedback && (
          <div style={{
            background: isDarkMode ? '#1e293b' : '#fff',
            color: isDarkMode ? '#f8fafc' : '#000',
            padding: '0.75rem',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            fontFamily: 'AR One Sans, Arial, sans-serif',
            fontWeight: 400,
            minHeight: 0,
            transition: 'background 0.3s ease, color 0.3s ease'
          }}>
            {parsedBreakdown.length > 0 ? (
              <div>
                {/* TTS button for detailed breakdown */}
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      const cacheKey = `detailed_breakdown_panel`;
                      playTTSAudio(shortFeedback, language, cacheKey);
                    }}
                    disabled={isGeneratingTTS['detailed_breakdown_panel'] || isPlayingTTS['detailed_breakdown_panel']}
                    style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: 6,
                      border: isPlayingTTS['detailed_breakdown_panel'] ? 'none' : '1px solid #28a745',
                      background: isPlayingTTS['detailed_breakdown_panel'] ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' : 'rgba(40,167,69,0.08)',
                      color: isPlayingTTS['detailed_breakdown_panel'] ? '#fff' : '#28a745',
                      fontSize: '0.7rem',
                      cursor: (isGeneratingTTS['detailed_breakdown_panel'] || isPlayingTTS['detailed_breakdown_panel']) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: (isGeneratingTTS['detailed_breakdown_panel'] || isPlayingTTS['detailed_breakdown_panel']) ? 0.6 : 1,
                      fontWeight: 500,
                      boxShadow: isPlayingTTS['detailed_breakdown_panel'] ? '0 2px 6px rgba(40,167,69,0.18)' : '0 1px 3px rgba(40,167,69,0.10)'
                    }}
                    title={isPlayingTTS['detailed_breakdown_panel'] ? 'Playing audio...' : 'Listen to this breakdown'}
                  >
                    {isGeneratingTTS['detailed_breakdown_panel'] ? '🔄' : isPlayingTTS['detailed_breakdown_panel'] ? '🔊 Playing' : '🔊 Listen'}
                  </button>
                </div>
                {parsedBreakdown.map((sentenceData, index) => (
                  <div key={index} style={{ marginBottom: index < parsedBreakdown.length - 1 ? '1rem' : '0' }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      width: '100%'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '0.4rem'
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          fontSize: '0.95rem', 
                          flex: 1,
                          color: isDarkMode ? '#f8fafc' : '#000'
                        }}>
                          {sentenceData.sentence}
                        </div>
                        {sentenceData.details && sentenceData.details.trim() && (
                          <button
                            onClick={() => {
                              // Handle details toggle
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isDarkMode ? '#8ba3d9' : '#3b5377',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '0.2rem',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            title="Show details"
                          >
                            ℹ️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                color: isDarkMode ? '#f8fafc' : '#000',
                lineHeight: 1.6
              }}>
                {shortFeedback}
              </div>
            )}
          </div>
        )}
        
        {/* User Preferences Tags */}
        {userPreferences && (
          <div style={{
            padding: '1rem',
            borderTop: isDarkMode ? '1px solid rgba(139,163,217,0.2)' : '1px solid rgba(59,83,119,0.15)',
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(139,163,217,0.05) 0%, rgba(139,163,217,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(59,83,119,0.05) 0%, rgba(59,83,119,0.02) 100%)'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}>
              {/* Topics Tags */}
              {userPreferences?.topics?.map((topic: string, index: number) => (
                <motion.span 
                  key={index}
                  style={{
                    background: isDarkMode ? 'rgba(196,181,253,0.15)' : 'rgba(132,84,109,0.1)',
                    color: isDarkMode ? 'var(--light-purple)' : 'var(--rose-primary)',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: isDarkMode ? '1px solid rgba(196,181,253,0.3)' : '1px solid rgba(132,84,109,0.2)',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                    boxShadow: isDarkMode ? '0 2px 8px rgba(196,181,253,0.1)' : '0 2px 8px rgba(132,84,109,0.08)',
                    backdropFilter: 'blur(10px)',
                    display: 'inline-block',
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 1.2, 
                    delay: index * 0.25,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    boxShadow: isDarkMode ? '0 4px 15px rgba(196,181,253,0.2)' : '0 4px 15px rgba(132,84,109,0.15)',
                    transition: { duration: 0.4 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.padding = '0.35rem 0.8rem';
                    e.currentTarget.innerHTML = `💬 ${topic}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.padding = '0.35rem 0.6rem';
                    e.currentTarget.innerHTML = '💬';
                  }}
                >
                  💬
                </motion.span>
              ))}
              
              {/* Formality Tag */}
              {userPreferences?.formality && (
                <motion.span 
                  style={{
                    background: isDarkMode ? 'rgba(139,163,217,0.15)' : 'rgba(59,83,119,0.1)',
                    color: isDarkMode ? 'var(--blue-secondary)' : 'var(--blue-secondary)',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: isDarkMode ? '1px solid rgba(139,163,217,0.3)' : '1px solid rgba(59,83,119,0.2)',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                    boxShadow: isDarkMode ? '0 2px 8px rgba(139,163,217,0.1)' : '0 2px 8px rgba(59,83,119,0.08)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 1.2, 
                    delay: (userPreferences?.topics?.length || 0) * 0.25 + 0.3,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    boxShadow: isDarkMode ? '0 4px 15px rgba(139,163,217,0.2)' : '0 4px 15px rgba(59,83,119,0.15)',
                    transition: { duration: 0.4 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.padding = '0.35rem 0.8rem';
                    e.currentTarget.innerHTML = `🎭 ${userPreferences.formality}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.padding = '0.35rem 0.6rem';
                    e.currentTarget.innerHTML = '🎭';
                  }}
                >
                  🎭
                </motion.span>
              )}
              
              {/* Learning Goals Tags */}
              {userPreferences?.user_goals?.map((goalId: string, index: number) => {
                const goal = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
                return goal ? (
                  <motion.span 
                    key={index} 
                    style={{
                      background: isDarkMode ? 'rgba(240,200,208,0.15)' : 'rgba(214,182,182,0.1)',
                      color: isDarkMode ? 'var(--rose-accent)' : 'var(--rose-accent)',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: isDarkMode ? '1px solid rgba(240,200,208,0.3)' : '1px solid rgba(214,182,182,0.2)',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Montserrat, Arial, sans-serif',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(240,200,208,0.1)' : '0 2px 8px rgba(214,182,182,0.08)',
                      backdropFilter: 'blur(10px)',
                      display: 'inline-block',
                      flexShrink: 0,
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      duration: 1.2, 
                      delay: ((userPreferences?.topics?.length || 0) + (userPreferences?.formality ? 1 : 0)) * 0.25 + index * 0.25 + 0.5,
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -2,
                      boxShadow: isDarkMode ? '0 4px 15px rgba(240,200,208,0.2)' : '0 4px 15px rgba(214,182,182,0.15)',
                      transition: { duration: 0.4 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.padding = '0.35rem 0.8rem';
                      e.currentTarget.innerHTML = `${goal.icon} ${goal.goal}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.padding = '0.35rem 0.6rem';
                      e.currentTarget.innerHTML = goal.icon;
                    }}
                  >
                    {goal.icon}
                  </motion.span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortFeedbackPanel;

