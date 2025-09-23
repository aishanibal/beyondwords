import { ChatMessage } from '../types/analyze';

// Placeholder function for explaining LLM response
export const explainLLMResponse = (messageIndex: number, text: string) => {
  console.log('explainLLMResponse called:', messageIndex, text);
  // TODO: Implement from original
};

// Placeholder function for rendering clickable message
export const renderClickableMessage = (message: any, messageIndex: number, translation: any) => {
  console.log('renderClickableMessage called:', message, messageIndex, translation);
  // TODO: Implement from original
  return null;
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
