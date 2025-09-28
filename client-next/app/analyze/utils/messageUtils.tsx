import { ChatMessage } from '../types/analyze';

// Placeholder function for explaining LLM response
export const explainLLMResponse = (messageIndex: number, text: string) => {
  console.log('explainLLMResponse called:', messageIndex, text);
  // TODO: Implement from original
};

// Render clickable message with word translations
export const renderClickableMessage = (message: any, messageIndex: number, translation: any, setActivePopup?: any, isDarkMode?: boolean, userPreferences?: any, language?: string) => {
  const messageText = typeof message === 'string' ? message : message.text;

  if (!translation || !translation.wordTranslations) {
    return messageText;
  }
  
  console.log('renderClickableMessage:', {
    messageText: messageText,
    generatedWords: translation.generatedWords,
    generatedScriptWords: translation.generatedScriptWords,
    wordTranslations: translation.wordTranslations,
    availableKeys: Object.keys(translation.wordTranslations)
  });
  
  // Use the generated words from the AI response to guarantee keys exist
  if (translation.generatedWords && translation.generatedWords.length > 0) {
    // Check if this is a script language (has both script and romanized words)
    const isScriptLanguage = translation.generatedScriptWords && 
                            translation.generatedScriptWords.length > 0 && 
                            translation.generatedScriptWords.some(word => /[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u1100-\u11FF\u1200-\u137F\u1380-\u139F\u13A0-\u13FF\u1400-\u167F\u1680-\u169F\u16A0-\u16FF\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F\u1780-\u17FF\u1800-\u18AF\u1900-\u194F\u1950-\u197F\u1980-\u19DF\u19E0-\u19FF\u1A00-\u1A1F\u1A20-\u1AAF\u1AB0-\u1AFF\u1B00-\u1B7F\u1B80-\u1BBF\u1BC0-\u1BFF\u1C00-\u1C4F\u1C50-\u1C7F\u1C80-\u1CDF\u1CD0-\u1CFF\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u1E00-\u1EFF\u1F00-\u1FFF]/.test(word));
    
    if (isScriptLanguage && translation.generatedScriptWords.length > 0) {
      return (
        <div>
          {/* Script words */}
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Script:</strong>
            <div style={{ 
              marginTop: '0.25rem',
              fontSize: '1rem',
              lineHeight: '1.8',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem'
            }}>
              {renderClickableWordsFromGenerated(translation.generatedScriptWords, translation, messageIndex, setActivePopup)}
            </div>
          </div>
          {/* Romanized words */}
          <div>
            <strong>Romanized:</strong>
            <div style={{ 
              marginTop: '0.25rem',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              color: isDarkMode ? '#cbd5e1' : '#6c757d',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem'
            }}>
              {renderClickableWordsFromGenerated(translation.generatedWords, translation, messageIndex, setActivePopup)}
            </div>
          </div>
        </div>
      );
    } else {
      // Non-script language - just show romanized words
      return (
        <div>
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ 
              marginTop: '0.25rem',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.25rem'
            }}>
              {renderClickableWordsFromGenerated(translation.generatedWords, translation, messageIndex, setActivePopup)}
            </div>
          </div>
        </div>
      );
    }
  } else {
    // Fallback to original message text
    const displayText = formatMessageForDisplay(message, userPreferences?.romanizationDisplay || 'both');
    const textToRender = displayText;
    return renderClickableWords(textToRender, translation, messageIndex, setActivePopup);
  }
};

// Helper function to render clickable words from generated word list
const renderClickableWordsFromGenerated = (generatedWords: string[], translation: any, messageIndex: number, setActivePopup?: any) => {
  console.log('=== RENDERING FROM GENERATED WORDS ===');
  console.log('Generated words:', generatedWords);
  console.log('Available translations:', Object.keys(translation.wordTranslations));
  
  return generatedWords.map((word, index) => {
    const trimmedWord = word.trim();
    
    // Try exact match first, then try without punctuation
    const hasTranslation = translation.wordTranslations[trimmedWord] || 
                          translation.wordTranslations[trimmedWord.replace(/[.,!?;:'"()\[\]{}]/g, '').trim()];
    
    console.log(`Generated word "${trimmedWord}": hasTranslation=${hasTranslation}`);
    
    if (hasTranslation && trimmedWord) {
      return (
        <span
          key={index}
          data-clickable-word="true"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Word clicked:', trimmedWord, 'Translation:', hasTranslation);
            if (setActivePopup) {
              const rect = e.currentTarget.getBoundingClientRect();
              const popupPosition = {
                x: rect.left + rect.width / 2,
                y: rect.top
              };
              console.log('Setting popup with:', { messageIndex, wordKey: trimmedWord, position: popupPosition });
              setActivePopup({
                messageIndex,
                wordKey: trimmedWord,
                position: popupPosition
              });
            }
          }}
          style={{
            cursor: 'pointer',
            textDecoration: 'underline',
            textDecorationColor: '#4a90e2',
            textDecorationThickness: '2px',
            color: '#4a90e2',
            fontWeight: 400,
            transition: 'all 0.2s ease',
            marginRight: '0.25rem',
            whiteSpace: 'nowrap',
            display: 'inline-block'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(74,144,226,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {word}
        </span>
      );
    }
    
    return <span key={index} style={{ marginRight: '0.25rem', whiteSpace: 'nowrap', display: 'inline-block' }}>{word}</span>;
  });
};

// Helper function to render clickable words
const renderClickableWords = (text: string, translation: any, messageIndex: number, setActivePopup?: any) => {
  console.log('=== RENDERING CLICKABLE WORDS ===');
  console.log('Text to render:', text);
  console.log('Available translations:', Object.keys(translation.wordTranslations));
  
  const words = text.split(/(\s+)/);
  console.log('Split words:', words);
  
  return words.map((word, index) => {
    const trimmedWord = word.trim();
    
    // Simple matching - try exact match first
    let hasTranslation = translation.wordTranslations[trimmedWord];
    let translationKey = trimmedWord;
    
    console.log(`Checking word "${trimmedWord}": exact match = ${hasTranslation}`);
    
    // If no exact match, try case-insensitive
    if (!hasTranslation) {
      const lowerTrimmedWord = trimmedWord.toLowerCase();
      const availableKeys = Object.keys(translation.wordTranslations);
      const matchingKey = availableKeys.find(key => key.toLowerCase() === lowerTrimmedWord);
      if (matchingKey) {
        hasTranslation = translation.wordTranslations[matchingKey];
        translationKey = matchingKey;
        console.log(`Found case-insensitive match: "${trimmedWord}" → "${matchingKey}"`);
      }
    }
    
    // If still no match, try partial matching
    if (!hasTranslation && trimmedWord) {
      const availableKeys = Object.keys(translation.wordTranslations);
      const partialMatches = availableKeys.filter(key => 
        key.includes(trimmedWord) || trimmedWord.includes(key)
      );
      if (partialMatches.length > 0) {
        console.log(`Partial matches for "${trimmedWord}":`, partialMatches);
      }
    }
    
    console.log(`Final result for "${trimmedWord}": hasTranslation=${hasTranslation}, translationKey="${translationKey}"`);
    
    if (hasTranslation && trimmedWord) {
      return (
        <span
          key={index}
          data-clickable-word="true"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Word clicked:', trimmedWord, 'Translation:', hasTranslation);
            if (setActivePopup) {
              const rect = e.currentTarget.getBoundingClientRect();
              const popupPosition = {
                x: rect.left + rect.width / 2,
                y: rect.top
              };
              setActivePopup({
                messageIndex,
                wordKey: translationKey,
                position: popupPosition
              });
            }
          }}
          style={{
            cursor: 'pointer',
            textDecoration: 'underline',
            textDecorationColor: '#4a90e2',
            textDecorationThickness: '2px',
            color: '#4a90e2',
            fontWeight: 400,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(74,144,226,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {word}
        </span>
      );
    }
    
    return word;
  });
};

// Get session messages (filter by session start time)
export const getSessionMessages = (chatHistory: ChatMessage[], sessionStartTime: Date | null): ChatMessage[] => {
  if (!sessionStartTime) return chatHistory;
  return chatHistory.filter(message => new Date(message.timestamp) >= sessionStartTime);
};

// Format message for display
export const formatMessageForDisplay = (message: ChatMessage, romanizationDisplay: string): string => {
  if (romanizationDisplay === 'both' && message.romanizedText) {
    return `${message.romanizedText} (${message.text})`;
  } else if (romanizationDisplay === 'romanized' && message.romanizedText) {
    return message.romanizedText;
  } else {
    return message.text;
  }
};

// Check if message is from current session
export const isFromCurrentSession = (message: ChatMessage, sessionStartTime: Date | null): boolean => {
  if (!sessionStartTime) return true;
  return new Date(message.timestamp) >= sessionStartTime;
};

// Get message display text based on preferences
export const getMessageDisplayText = (message: ChatMessage, preferences: any): string => {
  const romanizationDisplay = preferences?.romanizationDisplay || 'both';
  return formatMessageForDisplay(message, romanizationDisplay);
};
