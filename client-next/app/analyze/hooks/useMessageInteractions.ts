import { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  getDetailedFeedback, 
  getShortFeedback, 
  getDetailedBreakdown, 
  getQuickTranslation, 
  explainLLMResponse 
} from '../services/messageService';
import { 
  extractFormattedSentence, 
  parseFeedbackExplanations, 
  extractCorrectedVersion 
} from '../utils/textFormatting';

export const useMessageInteractions = (language: string) => {
  // State for different types of feedback
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState<Record<number, boolean>>({});
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState<Record<number, boolean>>({});
  const [showShortFeedback, setShowShortFeedback] = useState<Record<number, boolean>>({});
  const [showQuickTranslations, setShowQuickTranslations] = useState<Record<number, boolean>>({});
  
  // Data storage
  const [detailedFeedback, setDetailedFeedback] = useState<Record<number, any>>({});
  const [shortFeedback, setShortFeedback] = useState<Record<number, any>>({});
  const [detailedBreakdown, setDetailedBreakdown] = useState<Record<number, any>>({});
  const [quickTranslations, setQuickTranslations] = useState<Record<number, any>>({});
  const [feedbackExplanations, setFeedbackExplanations] = useState<Record<number, any>>({});
  const [showCorrectedVersions, setShowCorrectedVersions] = useState<Record<number, boolean>>({});

  // Handle detailed feedback request (check button functionality)
  const handleRequestDetailedFeedback = useCallback(async (
    messageIndex: number, 
    text: string, 
    chatHistory: any[], 
    userPreferences: any,
    conversationId: string | null,
    setChatHistory: (history: any[] | ((prev: any[]) => any[])) => void,
    fetchUserDashboardPreferences?: (languageCode: string) => Promise<any>,
    setUserPreferences?: (prefs: any) => void
  ) => {
    if (!conversationId) {
      return;
    }
    
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const token = localStorage.getItem('jwt');
      
      // Get the message text and context
      const message = chatHistory[messageIndex];
      const user_input = message?.text || '';
      const context = chatHistory.slice(-4).map((msg: any) => `${msg.sender}: ${msg.text}`).join('\n');
      
      // Ensure user preferences are loaded for the current language
      if (fetchUserDashboardPreferences && setUserPreferences && 
          (!userPreferences.romanizationDisplay || userPreferences.romanizationDisplay === 'both')) {
        const dashboardPrefs = await fetchUserDashboardPreferences(language || 'en');
        if (dashboardPrefs) {
          setUserPreferences((prev: any) => ({
            ...prev,
            romanizationDisplay: dashboardPrefs.romanization_display || 'both'
          }));
        }
      }
      
      const requestData = {
        user_input,
        context,
        language,
        user_level: userPreferences.userLevel,
        user_topics: userPreferences.topics,
        romanization_display: userPreferences.romanizationDisplay
      };
      
      const response = await axios.post(
        '/api/feedback',
        requestData,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      
      const detailedFeedback = response.data.feedback;
      
      // Extract formatted sentence from feedback and update chat history
      const formattedSentence = extractFormattedSentence(detailedFeedback, userPreferences.romanizationDisplay || 'both');
      
      // Parse explanations for each highlighted word
      const explanations = parseFeedbackExplanations(detailedFeedback);
      
      // Extract corrected version
      const correctedVersion = extractCorrectedVersion(detailedFeedback);
      
      // Store explanations for this message
      setFeedbackExplanations(prev => ({
        ...prev,
        [messageIndex]: explanations
      }));
      
      // Show corrected version automatically when feedback is generated
      setShowCorrectedVersions(prev => ({
        ...prev,
        [messageIndex]: true
      }));
      
      // Update the message in chat history with the feedback and formatted text
      setChatHistory(prev => {
        const updated = prev.map((msg: any, idx: number) => {
          if (idx === messageIndex) {
            const updatedMsg = { 
              ...msg, 
              detailedFeedback: detailedFeedback,
              // Update the message text with formatted version if available
              ...(formattedSentence && {
                text: formattedSentence.mainText,
                romanizedText: formattedSentence.romanizedText
              })
            };
            return updatedMsg;
          }
          return msg;
        });
        return updated;
      });
      
      // Store feedback in the database for the specific message (if it has an ID)
      if (message && message.id) {
        const token = localStorage.getItem('jwt');
        try {
          await axios.post(
            '/api/messages/feedback',
            {
              messageId: message.id,
              feedback: detailedFeedback
            },
            token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
          );
        } catch (dbError) {
          console.error('Error saving feedback to database:', dbError);
        }
      }
      
    } catch (error) {
      console.error('Error getting detailed feedback:', error);
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  }, [language]);

  // Handle short feedback request
  const handleRequestShortFeedback = useCallback(async (messageIndex: number, text: string) => {
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const feedback = await getShortFeedback(messageIndex, text, language);
      setShortFeedback(prev => ({ ...prev, [messageIndex]: feedback }));
      setShowShortFeedback(prev => ({ ...prev, [messageIndex]: true }));
    } catch (error) {
      console.error('Error getting short feedback:', error);
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  }, [language]);

  // Handle detailed breakdown request
  const handleRequestDetailedBreakdown = useCallback(async (messageIndex: number, text: string) => {
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const breakdown = await getDetailedBreakdown(messageIndex, text, language);
      setDetailedBreakdown(prev => ({ ...prev, [messageIndex]: breakdown }));
      setShowDetailedBreakdown(prev => ({ ...prev, [messageIndex]: true }));
    } catch (error) {
      console.error('Error getting detailed breakdown:', error);
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  }, [language]);

  // Handle quick translation request
  const handleQuickTranslation = useCallback(async (messageIndex: number, text: string) => {
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const translation = await getQuickTranslation(messageIndex, text, language);
      setQuickTranslations(prev => ({ ...prev, [messageIndex]: translation }));
      setShowQuickTranslations(prev => ({ ...prev, [messageIndex]: true }));
    } catch (error) {
      console.error('Error getting quick translation:', error);
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  }, [language]);

  // Handle explain LLM response
  const handleExplainLLMResponse = useCallback(async (messageIndex: number, text: string) => {
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const explanation = await explainLLMResponse(messageIndex, text, language);
      setDetailedFeedback(prev => ({ ...prev, [messageIndex]: explanation }));
      setShowDetailedBreakdown(prev => ({ ...prev, [messageIndex]: true }));
    } catch (error) {
      console.error('Error explaining LLM response:', error);
    } finally {
      setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: false }));
    }
  }, [language]);

  // Toggle functions
  const handleToggleDetailedFeedback = useCallback((messageIndex: number) => {
    setShowDetailedBreakdown(prev => ({ 
      ...prev, 
      [messageIndex]: !prev[messageIndex] 
    }));
  }, []);

  const handleToggleShortFeedback = useCallback((messageIndex: number) => {
    setShowShortFeedback(prev => ({ 
      ...prev, 
      [messageIndex]: !prev[messageIndex] 
    }));
  }, []);

  return {
    // State
    isLoadingMessageFeedback,
    showDetailedBreakdown,
    showShortFeedback,
    showQuickTranslations,
    detailedFeedback,
    shortFeedback,
    detailedBreakdown,
    quickTranslations,
    feedbackExplanations,
    showCorrectedVersions,
    
    // Actions
    handleRequestDetailedFeedback,
    handleRequestShortFeedback,
    handleRequestDetailedBreakdown,
    handleQuickTranslation,
    handleExplainLLMResponse,
    handleToggleDetailedFeedback,
    handleToggleShortFeedback,
    
    // Setters
    setShowDetailedBreakdown,
    setShowShortFeedback,
    setShowQuickTranslations,
    setQuickTranslations,
    setFeedbackExplanations,
    setShowCorrectedVersions
  };
};


