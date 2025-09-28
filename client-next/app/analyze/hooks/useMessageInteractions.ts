import { useState, useCallback } from 'react';
import { 
  getDetailedFeedback, 
  getShortFeedback, 
  getDetailedBreakdown, 
  getQuickTranslation, 
  explainLLMResponse 
} from '../services/messageService';

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

  // Handle detailed feedback request
  const handleRequestDetailedFeedback = useCallback(async (messageIndex: number, text: string) => {
    setIsLoadingMessageFeedback(prev => ({ ...prev, [messageIndex]: true }));
    
    try {
      const feedback = await getDetailedFeedback(messageIndex, text, language);
      setDetailedFeedback(prev => ({ ...prev, [messageIndex]: feedback }));
      setShowDetailedBreakdown(prev => ({ ...prev, [messageIndex]: true }));
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
    setQuickTranslations
  };
};
