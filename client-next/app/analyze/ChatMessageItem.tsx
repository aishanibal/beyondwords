import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage, UserPreferences } from '../../lib/preferences'; // Adjust path as needed

// Helper function to format message for display
const formatMessageForDisplay = (message: ChatMessage, romanizationDisplay: 'always' | 'never' | 'if_different') => {
  const mainText = message.text || '';
  const romanizedText = message.romanized_text || '';
  const showRomanized =
    romanizationDisplay === 'always' ||
    (romanizationDisplay === 'if_different' &&
      romanizedText &&
      mainText.toLowerCase() !== romanizedText.toLowerCase());
  return {
    mainText: mainText,
    romanizedText: showRomanized ? romanizedText : '',
  };
};

// Helper function to get text for TTS
const getTTSText = (message: ChatMessage, romanizationDisplay: 'always' | 'never' | 'if_different', language: string) => {
    // For languages that use roman characters primarily, always use the main text.
    const romanCharLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no', 'fi'];
    if (romanCharLanguages.includes(language.split('-')[0])) {
      return message.text;
    }
  
    const mainText = message.text || '';
    const romanizedText = message.romanized_text || '';
    const showRomanized =
      romanizationDisplay === 'always' ||
      (romanizationDisplay === 'if_different' &&
        romanizedText &&
        mainText.toLowerCase() !== romanizedText.toLowerCase());
  
    // Prefer romanized text if it's available and supposed to be shown, otherwise use main text.
    return showRomanized && romanizedText ? romanizedText : mainText;
};
  

interface ChatMessageItemProps {
  message: ChatMessage;
  formatted: { mainText: string; romanizedText: string };
  isDarkMode: boolean;
  index: number;
  isLastMessage: boolean;
  toggleShortFeedback: (index: number) => void;
  toggleDetailedFeedback: (index: number) => void;
  generateTTSForText: (text: string, language: string, cacheKey: string) => void;
  language: string;
  userPreferences: UserPreferences;
  playTTS: (text: string, language: string, cacheKey: string) => void;
  getTTSText: (message: ChatMessage, romanizationDisplay: 'always' | 'never' | 'if_different') => string;
  isLoadingMessageFeedback: { [key: number]: boolean };
  isTranslating: { [key: number]: boolean };
  isGeneratingTTS: { [key: string]: boolean };
  isPlayingTTS: { [key: string]: boolean };
  quickTranslation: (index: number, text: string) => void;
  handleSuggestionButtonClick: () => void;
  isLoadingSuggestions: boolean;
  isProcessing: boolean;
  playExistingTTS: (url: string, cacheKey: string) => void;
  showCorrectedVersions: { [key: number]: boolean };
  extractCorrectedVersion: (feedback: string) => { mainText: string; romanizedText: string | null } | null;
  renderFormattedText: (text: string, index: number) => React.ReactNode;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({
  message,
  formatted,
  isDarkMode,
  index,
  isLastMessage,
  toggleShortFeedback,
  toggleDetailedFeedback,
  generateTTSForText,
  language,
  userPreferences,
  playTTS,
  getTTSText,
  isLoadingMessageFeedback,
  isTranslating,
  isGeneratingTTS,
  isPlayingTTS,
  quickTranslation,
  handleSuggestionButtonClick,
  isLoadingSuggestions,
  isProcessing,
  playExistingTTS,
  showCorrectedVersions,
  extractCorrectedVersion,
  renderFormattedText,
}) => {

  const isUserMessage = message.sender === 'User';

  const messageBubbleStyle = useMemo(() => ({
    padding: '1rem 1.25rem',
    borderRadius: isUserMessage ? '24px 24px 8px 24px' : '24px 24px 24px 8px',
    background: isUserMessage
      ? 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)'
      : (isDarkMode
        ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)'),
    color: isUserMessage ? '#fff' : 'var(--foreground)',
    border: isUserMessage ? 'none' : (isDarkMode ? '1px solid var(--border)' : '1px solid rgba(195,141,148,0.2)'),
    boxShadow: isUserMessage
      ? '0 8px 32px rgba(195,141,148,0.3), 0 2px 8px rgba(195,141,148,0.2)'
      : '0 8px 32px rgba(60,76,115,0.12), 0 2px 8px rgba(60,76,115,0.08)',
    maxWidth: '80%',
    wordWrap: 'break-word' as const,
    fontWeight: isUserMessage ? 600 : 400,
    fontFamily: 'AR One Sans, Arial, sans-serif',
    backdropFilter: 'blur(20px)',
    transform: 'translateZ(0)',
  }), [isUserMessage, isDarkMode]);

  const handleListenClick = useCallback(() => {
    const ttsText = getTTSText(message, userPreferences.romanizationDisplay);
    const cacheKey = `message_${index}`;
    playTTS(ttsText, language, cacheKey);
  }, [message, userPreferences, index, language, playTTS, getTTSText]);
  
  const handleToggleShortFeedback = useCallback(() => {
    toggleShortFeedback(index);
  }, [index, toggleShortFeedback]);

  const handleToggleDetailedFeedback = useCallback(() => {
    toggleDetailedFeedback(index);
  }, [index, toggleDetailedFeedback]);


  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUserMessage ? 'flex-end' : 'flex-start',
      marginBottom: '1rem',
      paddingRight: isUserMessage ? '0' : '2rem',
      paddingLeft: isUserMessage ? '2rem' : '0'
    }}>
      <div style={messageBubbleStyle}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.9rem' }}>{formatted.mainText}</span>
          {formatted.romanizedText && (
            <span style={{
              fontSize: '0.85em',
              color: isUserMessage ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#555'),
              opacity: 0.8,
              marginTop: 4,
            }}>
              {formatted.romanizedText}
            </span>
          )}

        </div>
      </div>
      
      {/* Corrected Version - Slides down from under the message */}
      {message.detailedFeedback && showCorrectedVersions[index] && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUserMessage ? 'flex-end' : 'flex-start',
            marginTop: '0.5rem',
            animation: 'slideDown 0.5s ease-out forwards',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '0.5rem 0.8rem',
              borderRadius: isUserMessage ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
              background: isDarkMode 
                ? 'rgba(16, 185, 129, 0.25)' 
                : 'rgba(16, 185, 129, 0.2)',
              color: isDarkMode ? '#10b981' : '#047857',
              fontSize: '0.85rem',
              fontWeight: 400,
              maxWidth: '70%',
              wordWrap: 'break-word',
              border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
              position: 'relative'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.3rem', 
              marginBottom: '0.2rem',
              fontSize: '0.75rem',
              opacity: 0.7,
              fontWeight: 500
            }}>
              <span>✓</span>
              <span>Corrected</span>
            </div>
            {(() => {
              const correctedVersion = extractCorrectedVersion(message.detailedFeedback);
              
              if (!correctedVersion) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500, lineHeight: 1.3 }}>
                      Correct!
                    </span>
                  </div>
                );
              }
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 500, lineHeight: 1.3 }}>
                    {correctedVersion.mainText}
                  </span>
                  {correctedVersion.romanizedText && (
                    <span style={{
                      fontSize: '0.8em',
                      opacity: 0.8,
                      marginTop: '0.15rem',
                      fontWeight: 400,
                      lineHeight: 1.2,
                    }}>
                      {correctedVersion.romanizedText}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        {isUserMessage && !message.detailedFeedback && (
            <button
            onClick={handleToggleDetailedFeedback}
            disabled={isLoadingMessageFeedback[index]}
            style={{
                padding: '0.3rem 0.8rem',
                borderRadius: 6,
                border: '1px solid var(--rose-primary)',
                background: isDarkMode ? 'rgba(232,179,195,0.15)' : 'rgba(132,84,109,0.1)',
                color: 'var(--rose-primary)',
                fontSize: '0.8rem',
                cursor: isLoadingMessageFeedback[index] ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isLoadingMessageFeedback[index] ? 0.6 : 1,
                minWidth: '80px',
                fontWeight: 600,
                fontFamily: 'Montserrat, Arial, sans-serif',
                marginTop: 4,
                boxShadow: isDarkMode ? '0 2px 8px rgba(232,179,195,0.1)' : '0 2px 8px rgba(132,84,109,0.08)',
                backdropFilter: 'blur(10px)'
            }}
            title="Check for errors"
            >
            {isLoadingMessageFeedback[index] ? '🔄' : '🎯 Check'}
            </button>
        )}
        {!isUserMessage && (
          <>
            <button
              onClick={() => quickTranslation(index, message.text)}
              disabled={isLoadingMessageFeedback[index]}
              style={{
                padding: '0.35rem 0.9rem',
                borderRadius: 6,
                border: '1px solid #4a90e2',
                background: 'rgba(74,144,226,0.08)',
                color: '#4a90e2',
                fontSize: '0.8rem',
                cursor: isLoadingMessageFeedback[index] ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoadingMessageFeedback[index] ? 0.6 : 1,
                minWidth: '70px',
                fontWeight: 500,
                boxShadow: '0 1px 3px rgba(74,144,226,0.10)'
              }}
              title="Get translation"
            >
              {isLoadingMessageFeedback[index] ? '🔄' : '💡 Explain'}
            </button>
            <button
              onClick={handleListenClick}
              disabled={isGeneratingTTS[`message_${index}`] || isPlayingTTS[`message_${index}`]}
              style={{
                padding: '0.3rem 0.7rem',
                borderRadius: 8,
                border: isPlayingTTS[`message_${index}`] ? 'none' : '1px solid var(--blue-secondary)',
                background: isPlayingTTS[`message_${index}`] ? 'linear-gradient(135deg, var(--blue-secondary) 0%, #2a4a6a 100%)' : isDarkMode ? 'rgba(139,163,217,0.15)' : 'rgba(59,83,119,0.1)',
                color: isPlayingTTS[`message_${index}`] ? '#fff' : 'var(--blue-secondary)',
                fontSize: '0.7rem',
                cursor: (isGeneratingTTS[`message_${index}`] || isPlayingTTS[`message_${index}`]) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: (isGeneratingTTS[`message_${index}`] || isPlayingTTS[`message_${index}`]) ? 0.6 : 1,
                minWidth: '80px',
                fontWeight: 600,
                fontFamily: 'Montserrat, Arial, sans-serif',
                boxShadow: isPlayingTTS[`message_${index}`] ? '0 2px 6px rgba(59,83,119,0.18)' : isDarkMode ? '0 2px 8px rgba(139,163,217,0.1)' : '0 2px 8px rgba(59,83,119,0.08)',
                backdropFilter: 'blur(10px)'
              }}
              title={isPlayingTTS[`message_${index}`] ? 'Playing audio...' : 'Listen to this message'}
            >
              {isGeneratingTTS[`message_${index}`] ? '🔄' : isPlayingTTS[`message_${index}`] ? '🔊 Playing' : '🔊 Listen'}
            </button>
            {isLastMessage && (
                <button
                    onClick={handleSuggestionButtonClick}
                    disabled={isLoadingSuggestions || isProcessing}
                    style={{
                        padding: '0.3rem 0.7rem',
                        border: '1px solid var(--rose-primary)',
                        background: isDarkMode ? 'rgba(232,179,195,0.15)' : 'rgba(132,84,109,0.1)',
                        color: 'var(--rose-primary)',
                        fontSize: '0.7rem',
                        cursor: (isLoadingSuggestions || isProcessing) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: (isLoadingSuggestions || isProcessing) ? 0.6 : 1,
                        fontWeight: 600,
                        fontFamily: 'Montserrat, Arial, sans-serif',
                        borderRadius: 8,
                        minWidth: '80px',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(232,179,195,0.1)' : '0 2px 8px rgba(132,84,109,0.08)',
                        backdropFilter: 'blur(10px)'
                    }}
                    title="Get conversation suggestions"
                >
                    {isLoadingSuggestions ? 'Loading...' : isProcessing ? 'Processing...' : '💡 Suggestions'}
                </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

ChatMessageItem.displayName = 'ChatMessageItem';

export default ChatMessageItem;
