import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from '../types/analyze';
import { formatScriptLanguageText } from '../utils/romanization';

interface SuggestionCarouselProps {
  isDarkMode: boolean;
  suggestionMessages: ChatMessage[];
  currentSuggestionIndex: number;
  onNavigateSuggestion: (direction: 'prev' | 'next') => void;
  onExplainSuggestion: (index: number, text: string) => void;
  onPlaySuggestionTTS: (suggestion: ChatMessage, index: number) => void;
  isTranslatingSuggestion: Record<number, boolean>;
  showSuggestionTranslations: Record<number, boolean>;
  suggestionTranslations: Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>;
  isGeneratingTTS: Record<string, boolean>;
  isPlayingTTS: Record<string, boolean>;
  userPreferences: any;
  language: string;
}

const SuggestionCarousel: React.FC<SuggestionCarouselProps> = ({
  isDarkMode,
  suggestionMessages,
  currentSuggestionIndex,
  onNavigateSuggestion,
  onExplainSuggestion,
  onPlaySuggestionTTS,
  isTranslatingSuggestion,
  showSuggestionTranslations,
  suggestionTranslations,
  isGeneratingTTS,
  isPlayingTTS,
  userPreferences,
  language
}) => {
  const suggestion = suggestionMessages[currentSuggestionIndex];
  if (!suggestion) return null;

  const formatMessageForDisplay = (message: ChatMessage, romanizationDisplay: string, language: string) => {
    const formatted = formatScriptLanguageText(message.text, language);
    return formatted;
  };

  const getTTSText = (message: ChatMessage, romanizationDisplay: string, language: string) => {
    // Clean text for TTS by removing romanization if needed
    if (romanizationDisplay === 'original' || romanizationDisplay === 'both') {
      return message.text;
    } else {
      // If only showing romanization, use the romanized text
      return message.romanizedText || message.text;
    }
  };

  return (
    <div style={{
      width: '100%',
      padding: '0.75rem 0.75rem 0.75rem 0.75rem',
      marginTop: '0.5rem'
    }}>
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}>
        <div className="hover-lift" style={{
          maxWidth: '70%',
          padding: '1rem 1.25rem',
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(195,141,148,0.15) 0%, rgba(195,141,148,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(195,141,148,0.12) 0%, rgba(195,141,148,0.06) 100%)',
          color: isDarkMode ? 'var(--foreground)' : '#3e3e3e',
          borderRadius: '28px 28px 8px 28px',
          border: isDarkMode ? '2px dashed rgba(195,141,148,0.5)' : '2px dashed #c38d94',
          fontSize: '0.85rem',
          fontWeight: 600,
          position: 'relative',
          boxShadow: isDarkMode 
            ? '0 8px 32px rgba(195,141,148,0.2), 0 2px 8px rgba(195,141,148,0.1)' 
            : '0 8px 32px rgba(195,141,148,0.25), 0 2px 8px rgba(195,141,148,0.15)',
          fontFamily: 'AR One Sans, Arial, sans-serif',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
            fontSize: '0.8rem',
            color: isDarkMode ? '#8ba3d9' : '#3b5377'
          }}>
            <span>💭 Suggestion ({currentSuggestionIndex + 1}/{suggestionMessages.length})</span>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <motion.button
                onClick={() => onNavigateSuggestion('prev')}
                disabled={suggestionMessages.length <= 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: 6,
                  border: `1px solid ${isDarkMode ? 'rgba(139,163,217,0.6)' : '#3b5377'}`,
                  background: isDarkMode ? 'rgba(139,163,217,0.08)' : 'rgba(59,83,119,0.08)',
                  color: isDarkMode ? '#8ba3d9' : '#3b5377',
                  cursor: suggestionMessages.length <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.7rem',
                  opacity: suggestionMessages.length <= 1 ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                  fontWeight: 600
                }}
              >
                ←
              </motion.button>
              <motion.button
                onClick={() => onNavigateSuggestion('next')}
                disabled={suggestionMessages.length <= 1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: 6,
                  border: `1px solid ${isDarkMode ? 'rgba(139,163,217,0.6)' : '#3b5377'}`,
                  background: isDarkMode ? 'rgba(139,163,217,0.08)' : 'rgba(59,83,119,0.08)',
                  color: isDarkMode ? '#8ba3d9' : '#3b5377',
                  cursor: suggestionMessages.length <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.7rem',
                  opacity: suggestionMessages.length <= 1 ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                  fontWeight: 600
                }}
              >
                →
              </motion.button>
            </div>
          </div>
          <div style={{
            lineHeight: '1.4',
            wordWrap: 'break-word',
            marginBottom: '0.3rem'
          }}>
            {(() => {
              const text = suggestion?.text || '';
              const formatted = formatScriptLanguageText(text, language);
              return (
                <>
                  <span>{formatted.mainText}</span>
                  {formatted.romanizedText && (
                    <span style={{
                      fontSize: '0.85em',
                      color: '#555',
                      opacity: 0.65,
                      marginTop: 2,
                      fontWeight: 400,
                      lineHeight: '1.2',
                      letterSpacing: '0.01em',
                      display: 'block'
                    }}>
                      {formatted.romanizedText}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
          
          {/* Explain and Listen buttons for suggestions */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '0.5rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => onExplainSuggestion(currentSuggestionIndex, suggestion.text)}
              style={{
                padding: '0.35rem 0.9rem',
                borderRadius: 6,
                border: '1px solid #4a90e2',
                background: 'rgba(74,144,226,0.08)',
                color: '#4a90e2',
                fontSize: '0.8rem',
                cursor: isTranslatingSuggestion[currentSuggestionIndex] ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isTranslatingSuggestion[currentSuggestionIndex] ? 0.6 : 1,
                minWidth: '70px',
                fontWeight: 500,
                boxShadow: '0 1px 3px rgba(74,144,226,0.10)'
              }}
              title="Get translation"
            >
              {isTranslatingSuggestion[currentSuggestionIndex] ? '🔄' : '💡 Explain'}
            </button>
            
            <button
              onClick={() => onPlaySuggestionTTS(suggestion, currentSuggestionIndex)}
              disabled={isGeneratingTTS[`suggestion_${currentSuggestionIndex}`] || isPlayingTTS[`suggestion_${currentSuggestionIndex}`]}
              style={{
                padding: '0.3rem 0.7rem',
                borderRadius: 8,
                border: isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? 'none' : '1px solid var(--blue-secondary)',
                background: isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? 'linear-gradient(135deg, var(--blue-secondary) 0%, #2a4a6a 100%)' : isDarkMode ? 'rgba(139,163,217,0.15)' : 'rgba(59,83,119,0.1)',
                color: isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? '#fff' : 'var(--blue-secondary)',
                fontSize: '0.7rem',
                cursor: (isGeneratingTTS[`suggestion_${currentSuggestionIndex}`] || isPlayingTTS[`suggestion_${currentSuggestionIndex}`]) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: (isGeneratingTTS[`suggestion_${currentSuggestionIndex}`] || isPlayingTTS[`suggestion_${currentSuggestionIndex}`]) ? 0.6 : 1,
                minWidth: '80px',
                fontWeight: 600,
                fontFamily: 'Montserrat, Arial, sans-serif',
                boxShadow: isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? '0 2px 6px rgba(59,83,119,0.18)' : isDarkMode ? '0 2px 8px rgba(139,163,217,0.1)' : '0 2px 8px rgba(59,83,119,0.08)',
                backdropFilter: 'blur(10px)'
              }}
              title={isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? 'Playing audio...' : 'Listen to this message'}
            >
              {isGeneratingTTS[`suggestion_${currentSuggestionIndex}`] ? '🔄' : isPlayingTTS[`suggestion_${currentSuggestionIndex}`] ? '🔊 Playing' : '🔊 Listen'}
            </button>
          </div>
          
          {/* Show suggestion translation/explanation if available */}
          {showSuggestionTranslations[currentSuggestionIndex] && suggestionTranslations[currentSuggestionIndex] && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderRadius: '8px',
              border: '1px solid rgba(74,144,226,0.2)'
            }}>
              {suggestionTranslations[currentSuggestionIndex].translation && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: isDarkMode ? '#8ba3d9' : '#4a90e2' }}>Translation:</strong>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
                    {suggestionTranslations[currentSuggestionIndex].translation}
                  </div>
                </div>
              )}
              {suggestionTranslations[currentSuggestionIndex].breakdown && (
                <div>
                  <strong style={{ color: isDarkMode ? '#8ba3d9' : '#4a90e2' }}>Explanation:</strong>
                  <div style={{ 
                    marginTop: '0.25rem', 
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {suggestionTranslations[currentSuggestionIndex].breakdown}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionCarousel;
