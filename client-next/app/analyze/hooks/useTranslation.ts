import { useState, useCallback } from 'react';
import axios from 'axios';
import { TranslationData } from '../types/analyze';

export function useTranslation() {
  const [translations, setTranslations] = useState<Record<number, TranslationData>>({});
  const [isTranslating, setIsTranslating] = useState<Record<number, boolean>>({});
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [suggestionTranslations, setSuggestionTranslations] = useState<Record<number, TranslationData>>({});
  const [isTranslatingSuggestion, setIsTranslatingSuggestion] = useState<Record<number, boolean>>({});
  const [showSuggestionTranslations, setShowSuggestionTranslations] = useState<Record<number, boolean>>({});

  const translateMessage = useCallback(async (
    messageIndex: number, 
    text: string, 
    breakdown = false,
    chatHistory: any[] = [],
    language = 'en',
    userPreferences: any = {},
    user: any = null
  ) => {
    if (isTranslating[messageIndex]) return;
    
    setIsTranslating(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      
      if (breakdown) {
        // Prepare chat history for detailed breakdown
        const chatHistoryForBreakdown = chatHistory.map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp
        }));
        
        console.log('🔍 [FRONTEND] Sending chat history to detailed breakdown:', chatHistoryForBreakdown.length, 'messages');
        
        // Call detailed breakdown API
        const response = await axios.post('/api/detailed_breakdown', {
          llm_response: text,
          user_input: '', // We don't have the user input for this message
          chat_history: chatHistoryForBreakdown, // Send full chat history for context
          language: language,
          user_level: userPreferences.userLevel,
          user_topics: userPreferences.topics,
          user_goals: user?.learning_goals ? (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : [],
          formality: userPreferences.formality,
          feedback_language: userPreferences.feedbackLanguage
        }, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        
        setTranslations(prev => ({ 
          ...prev, 
          [messageIndex]: { 
            translation: text, // Show original text as translation
            breakdown: response.data.breakdown,
            has_breakdown: true
          } 
        }));
      } else {
        // Call regular translation API
        const response = await axios.post(
          '/api/translate',
          {
            text,
            source_language: 'auto',
            target_language: 'en',
            breakdown
          },
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        
        setTranslations(prev => ({ 
          ...prev, 
          [messageIndex]: response.data 
        }));
      }
      
      setShowTranslations(prev => ({ 
        ...prev, 
        [messageIndex]: true 
      }));
    } catch (error: unknown) {
      console.error('Translation/breakdown error:', error);
      setTranslations(prev => ({ 
        ...prev, 
        [messageIndex]: { 
          translation: breakdown ? 'Detailed breakdown failed' : 'Translation failed', 
          error: true 
        } 
      }));
    } finally {
      setIsTranslating(prev => ({ ...prev, [messageIndex]: false }));
    }
  }, [isTranslating]);

  const explainSuggestion = useCallback(async (
    suggestionIndex: number, 
    text: string,
    chatHistory: any[] = [],
    language = 'en',
    userPreferences: any = {},
    user: any = null
  ) => {
    if (isTranslatingSuggestion[suggestionIndex]) return;
    
    setIsTranslatingSuggestion(prev => ({ ...prev, [suggestionIndex]: true }));
    
    try {
      // Call the new API endpoint to get explanation and translation
      const token = localStorage.getItem('jwt');
      const requestData = {
        suggestion_text: text,
        chatHistory: chatHistory,
        language: language,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics,
        formality: userPreferences.formality,
        feedback_language: userPreferences.feedbackLanguage,
        user_goals: user?.learning_goals ? (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : []
      };
      
      const response = await axios.post('/api/explain_suggestion', requestData, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      const result = response.data;

      // Clean the explanation text to remove HTML-like markup
      const explanationText = typeof result.explanation === 'string' ? result.explanation : '';
      const cleanExplanation = explanationText.replace(/<[^>]*>/g, '').replace(/data-[^=]*="[^"]*"/g, '').replace(/onclick="[^"]*"/g, '').trim();
      
      const newTranslation = {
        translation: result.translation || '',
        breakdown: cleanExplanation,
        has_breakdown: true
      };
      
      setSuggestionTranslations(prev => ({ 
        ...prev, 
        [suggestionIndex]: newTranslation
      }));
      
      setShowSuggestionTranslations(prev => ({ 
        ...prev, 
        [suggestionIndex]: true 
      }));
    } catch (error: unknown) {
      console.error('Suggestion explanation error:', error);
      setSuggestionTranslations(prev => ({ 
        ...prev, 
        [suggestionIndex]: { 
          translation: 'Explanation failed', 
          error: true 
        } 
      }));
    } finally {
      setIsTranslatingSuggestion(prev => ({ ...prev, [suggestionIndex]: false }));
    }
  }, [isTranslatingSuggestion]);

  const handleMessageClick = useCallback((index: number) => {
    if (showTranslations[index]) {
      // Hide translation
      setShowTranslations(prev => ({ ...prev, [index]: false }));
    } else {
      // Show existing translation if available, otherwise do nothing
      // (Let the user use the Detailed Breakdown button for new translations)
      if (translations[index]) {
        setShowTranslations(prev => ({ ...prev, [index]: true }));
      }
      // Removed the automatic translation call to avoid interfering with detailed breakdown
    }
  }, [showTranslations, translations]);

  const toggleTranslation = useCallback((messageIndex: number, isSuggestion = false) => {
    const setShowTranslationsState = isSuggestion ? setShowSuggestionTranslations : setShowTranslations;
    
    setShowTranslationsState(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }));
  }, []);

  const clearTranslations = useCallback(() => {
    setTranslations({});
    setIsTranslating({});
    setShowTranslations({});
    setSuggestionTranslations({});
    setIsTranslatingSuggestion({});
    setShowSuggestionTranslations({});
  }, []);

  return {
    translations,
    isTranslating,
    showTranslations,
    suggestionTranslations,
    isTranslatingSuggestion,
    showSuggestionTranslations,
    translateMessage,
    explainSuggestion,
    handleMessageClick,
    toggleTranslation,
    clearTranslations,
  };
}
