import { useState, useCallback } from 'react';
import axios from 'axios';
import { formatScriptLanguageText } from '../types/analyze';

export interface SuggestionMessage {
  sender: string;
  text: string;
  romanizedText: string;
  timestamp: Date;
  messageType: string;
  isSuggestion: boolean;
  suggestionIndex: number;
  totalSuggestions: number;
  explanation?: string;
  translation?: string;
  romanized?: string;
}

export interface UseSuggestionsReturn {
  // State
  suggestions: string[];
  setSuggestions: (suggestions: string[]) => void;
  suggestionMessages: SuggestionMessage[];
  setSuggestionMessages: (messages: SuggestionMessage[]) => void;
  currentSuggestionIndex: number;
  setCurrentSuggestionIndex: (index: number) => void;
  showSuggestionCarousel: boolean;
  setShowSuggestionCarousel: (show: boolean) => void;
  isLoadingSuggestions: boolean;
  setIsLoadingSuggestions: (loading: boolean) => void;
  
  // Translation state for suggestions
  suggestionTranslations: Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>;
  setSuggestionTranslations: (translations: Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>) => void;
  isTranslatingSuggestion: Record<number, boolean>;
  setIsTranslatingSuggestion: (translating: Record<number, boolean>) => void;
  showSuggestionTranslations: Record<number, boolean>;
  setShowSuggestionTranslations: (show: Record<number, boolean>) => void;
  showSuggestionExplanations: boolean;
  setShowSuggestionExplanations: (show: boolean) => void;
  explainButtonPressed: boolean;
  setExplainButtonPressed: (pressed: boolean) => void;
  
  // Actions
  fetchSuggestions: () => Promise<void>;
  handleSuggestionButtonClick: () => Promise<void>;
  navigateSuggestion: (direction: 'prev' | 'next') => void;
  clearSuggestionCarousel: () => void;
  explainSuggestion: (index: number, text: string) => Promise<void>;
    playSuggestionTTS: (suggestion: any, index: number) => void;
}

export const useSuggestions = (
  user: any,
  language: string,
  conversationId: string | null,
  userPreferences: any,
  chatHistory: any[],
  formatScriptLanguageText: (text: string, language: string) => { mainText: string; romanizedText?: string }
): UseSuggestionsReturn => {
  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionMessages, setSuggestionMessages] = useState<SuggestionMessage[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [showSuggestionCarousel, setShowSuggestionCarousel] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Translation state for suggestions
  const [suggestionTranslations, setSuggestionTranslations] = useState<Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>>({});
  const [isTranslatingSuggestion, setIsTranslatingSuggestion] = useState<Record<number, boolean>>({});
  const [showSuggestionTranslations, setShowSuggestionTranslations] = useState<Record<number, boolean>>({});
  const [showSuggestionExplanations, setShowSuggestionExplanations] = useState(false);
  const [explainButtonPressed, setExplainButtonPressed] = useState(false);

  // Fetch suggestions - from original
  const fetchSuggestions = useCallback(async () => {
    if (!user) return;
    
    console.log('🔍 [DEBUG] fetchSuggestions called');
    setIsLoadingSuggestions(true);
    try {
      const token = localStorage.getItem('jwt');
      // Prepare chat history for suggestions - include all messages including the most recent user message
      const chatHistoryForSuggestions = chatHistory.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp
      }));
      
      console.log('🔍 [DEBUG] Sending chat history to suggestions:', chatHistoryForSuggestions.length, 'messages');
      console.log('🔍 [DEBUG] Chat history details:', chatHistoryForSuggestions);
      
      const response = await axios.post(
        '/api/suggestions',
        {
          conversationId: conversationId,
          chat_history: chatHistoryForSuggestions, // Send chat history directly
          language: language,
          user_level: userPreferences?.userLevel || 'beginner',
          user_topics: userPreferences?.topics || [],
          formality: userPreferences?.formality || 'neutral',
          feedback_language: userPreferences?.feedbackLanguage || 'en'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );
      
      console.log('🔍 [DEBUG] Suggestions response:', response.data);
      const suggestions = response.data.suggestions || [];
      setSuggestions(suggestions);
      
      // Also set suggestionMessages for the carousel
      if (suggestions.length > 0) {
        // Reset explanation state for a fresh set
        setSuggestionTranslations({});
        setShowSuggestionTranslations({});
        setIsTranslatingSuggestion({});
        setShowSuggestionExplanations(false);
        setExplainButtonPressed(false);
        console.log('🔍 [DEBUG] Setting suggestions:', suggestions);
        const tempMessages = suggestions.map((suggestion: any, index: number) => {
          const formattedText = formatScriptLanguageText(suggestion.text?.replace(/\*\*/g, '') || '', language);
          return {
            sender: 'User',
            text: formattedText.mainText,
            romanizedText: formattedText.romanizedText || suggestion.romanized || '',
            timestamp: new Date(),
            messageType: 'text',
            isSuggestion: true,
            suggestionIndex: index,
            totalSuggestions: suggestions.length,
            explanation: suggestion.explanation || '',
            translation: suggestion.translation || '',
            romanized: suggestion.romanized || ''
          };
        });
        
        console.log('🔍 [DEBUG] Setting suggestionMessages:', tempMessages);
        setSuggestionMessages(tempMessages);
        setCurrentSuggestionIndex(0);
        setShowSuggestionCarousel(true);
        console.log('🔍 [DEBUG] Set showSuggestionCarousel to true');
      }
    } catch (error: unknown) {
      console.error('🔍 [DEBUG] Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [user, language, conversationId, userPreferences, chatHistory, formatScriptLanguageText]);

  // Handle suggestion button click - from original
  const handleSuggestionButtonClick = useCallback(async () => {
    if (!user) return;
    
    console.log('🔍 [DEBUG] handleSuggestionButtonClick called');
    setIsLoadingSuggestions(true);
    try {
      const token = localStorage.getItem('jwt');
      console.log('🔍 [DEBUG] Suggestions request - language:', language);
      console.log('🔍 [DEBUG] Suggestions request - userPreferences:', userPreferences);
      
      // Prepare chat history for suggestions - include all messages including the most recent user message
      const chatHistoryForSuggestions = chatHistory.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp
      }));
      
      console.log('🔍 [DEBUG] Sending chat history to suggestions (button click):', chatHistoryForSuggestions.length, 'messages');
      console.log('🔍 [DEBUG] Chat history details (button click):', chatHistoryForSuggestions);
      
      const response = await axios.post(
        '/api/suggestions',
        {
          conversationId: conversationId,
          chat_history: chatHistoryForSuggestions, // Send chat history directly
          language: language,
          user_level: userPreferences?.userLevel || 'beginner',
          user_topics: userPreferences?.topics || [],
          formality: userPreferences?.formality || 'neutral',
          feedback_language: userPreferences?.feedbackLanguage || 'en'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );
      
      console.log('🔍 [DEBUG] Suggestions response (button click):', response.data);
      const suggestions = response.data.suggestions || [];
      if (suggestions.length > 0) {
        // Create temporary suggestion messages with all data from the API
        // Reset explanation-related state so previous clicks don't persist
        setSuggestionTranslations({});
        setShowSuggestionTranslations({});
        setIsTranslatingSuggestion({});
        setShowSuggestionExplanations(false);
        setExplainButtonPressed(false);
        const tempMessages = suggestions.map((suggestion: any, index: number) => {
          const formattedText = formatScriptLanguageText(suggestion.text?.replace(/\*\*/g, '') || '', language);
          return {
            sender: 'User',
            text: formattedText.mainText,
            romanizedText: formattedText.romanizedText || suggestion.romanized || '',
            timestamp: new Date(),
            messageType: 'text',
            isSuggestion: true,
            suggestionIndex: index,
            totalSuggestions: suggestions.length,
            explanation: suggestion.explanation || '',
            translation: suggestion.translation || '',
            romanized: suggestion.romanized || ''
          };
        });
        
        console.log('🔍 [DEBUG] Setting suggestionMessages (button click):', tempMessages);
        setSuggestionMessages(tempMessages);
        setSuggestions(suggestions);
        setCurrentSuggestionIndex(0);
        setShowSuggestionCarousel(true);
        console.log('🔍 [DEBUG] Set showSuggestionCarousel to true (button click)');
      }
    } catch (error: unknown) {
      console.error('🔍 [DEBUG] Error fetching suggestions (button click):', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [user, language, conversationId, userPreferences, chatHistory, formatScriptLanguageText]);

  // Navigate suggestion carousel - from original
  const navigateSuggestion = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentSuggestionIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
    } else {
      setCurrentSuggestionIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
    }
  }, [suggestions.length]);

  // Clear suggestion carousel - from original
  const clearSuggestionCarousel = useCallback(() => {
    setCurrentSuggestionIndex(0);
    setSuggestions([]);
    setSuggestionMessages([]);
    setShowSuggestionCarousel(false);
    // Fully clear explanation state when suggestions are cleared
    setSuggestionTranslations({});
    setShowSuggestionTranslations({});
    setIsTranslatingSuggestion({});
    setShowSuggestionExplanations(false);
  }, []);

  // Explain suggestion - fixed implementation
  const explainSuggestion = useCallback(async (index: number, text: string) => {
    setIsTranslatingSuggestion(prev => ({
      ...prev,
      [index]: true
    }));

    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post('/api/explain_suggestion', {
        suggestion_text: text,
        chatHistory: chatHistory,
        language: language,
        user_level: userPreferences?.userLevel || 'beginner',
        user_topics: userPreferences?.topics || [],
        formality: userPreferences?.formality || 'neutral',
        feedback_language: userPreferences?.feedbackLanguage || 'en',
        user_goals: user?.learning_goals ? (typeof user.learning_goals === 'string' ? JSON.parse(user.learning_goals) : user.learning_goals) : []
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.data.success) {
        setSuggestionTranslations(prev => ({
          ...prev,
          [index]: {
            translation: response.data.explanation,
            breakdown: response.data.breakdown,
            has_breakdown: true
          }
        }));
        setShowSuggestionTranslations(prev => ({
          ...prev,
          [index]: true
        }));
      }
    } catch (error) {
      console.error('Error explaining suggestion:', error);
    } finally {
      setIsTranslatingSuggestion(prev => ({
        ...prev,
        [index]: false
      }));
    }
  }, [language, chatHistory, userPreferences, user]);

  // Play suggestion TTS - implementation
  const playSuggestionTTS = useCallback(async (suggestion: any, index: number) => {
    console.log('🔍 [DEBUG] Playing suggestion TTS:', suggestion.text, index);
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post('/api/tts', {
        text: suggestion.text,
        language: language,
        cacheKey: `suggestion_${index}_${Date.now()}`
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      if (response.data.ttsUrl) {
        const audio = new Audio(response.data.ttsUrl);
        await audio.play();
      }
    } catch (error: any) {
      console.error('Error playing suggestion TTS:', error);
      
      // Handle specific error cases
      if (error.response?.status === 503) {
        console.warn('TTS service is temporarily unavailable for suggestion audio.');
      } else if (error.response?.status === 500) {
        console.warn('Suggestion TTS generation failed. Please try again later.');
      } else {
        console.warn('Suggestion TTS request failed:', error.message);
      }
    }
  }, [language]);

  return {
    // State
    suggestions,
    setSuggestions,
    suggestionMessages,
    setSuggestionMessages,
    currentSuggestionIndex,
    setCurrentSuggestionIndex,
    showSuggestionCarousel,
    setShowSuggestionCarousel,
    isLoadingSuggestions,
    setIsLoadingSuggestions,
    
    // Translation state for suggestions
    suggestionTranslations,
    setSuggestionTranslations,
    isTranslatingSuggestion,
    setIsTranslatingSuggestion,
    showSuggestionTranslations,
    setShowSuggestionTranslations,
    showSuggestionExplanations,
    setShowSuggestionExplanations,
    explainButtonPressed,
    setExplainButtonPressed,
    
    // Actions
    fetchSuggestions,
    handleSuggestionButtonClick,
    navigateSuggestion,
    clearSuggestionCarousel,
    explainSuggestion,
    playSuggestionTTS
  };
};
