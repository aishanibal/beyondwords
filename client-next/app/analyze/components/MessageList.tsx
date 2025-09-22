import React from 'react';
import { ChatMessage } from '../types/analyze';
import ChatMessageItem from '../ChatMessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  onMessageClick: (index: number, text: string) => void;
  onTranslateMessage: (messageIndex: number, text: string, breakdown?: boolean) => void;
  onRequestDetailedFeedback: (messageIndex: number) => void;
  onRequestShortFeedback: (messageIndex: number) => void;
  onRequestDetailedBreakdown: (messageIndex: number) => void;
  onToggleDetailedFeedback: (messageIndex: number) => void;
  onToggleShortFeedback: (messageIndex: number) => void;
  onQuickTranslation: (messageIndex: number, text: string) => void;
  onExplainLLMResponse: (messageIndex: number, text: string) => void;
  translations: Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>;
  isTranslating: Record<number, boolean>;
  showTranslations: Record<number, boolean>;
  suggestionTranslations: Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>;
  isTranslatingSuggestion: Record<number, boolean>;
  showSuggestionTranslations: Record<number, boolean>;
  isLoadingMessageFeedback: Record<number, boolean>;
  shortFeedbacks: Record<number, string>;
  romanizationDisplay: string;
  language: string;
  isDarkMode: boolean;
  onPlayTTS: (text: string, language: string) => void;
  onPlayExistingTTS: (ttsUrl: string) => void;
  isPlayingTTS: boolean;
  currentPlayingText: string | null;
  isPlayingAnyTTS?: boolean;
  isGeneratingTTS?: Record<string, boolean>;
}

export default function MessageList({
  messages,
  onMessageClick,
  onTranslateMessage,
  onRequestDetailedFeedback,
  onRequestShortFeedback,
  onRequestDetailedBreakdown,
  onToggleDetailedFeedback,
  onToggleShortFeedback,
  onQuickTranslation,
  onExplainLLMResponse,
  translations,
  isTranslating,
  showTranslations,
  suggestionTranslations,
  isTranslatingSuggestion,
  showSuggestionTranslations,
  isLoadingMessageFeedback,
  shortFeedbacks,
  romanizationDisplay,
  language,
  isDarkMode,
  onPlayTTS,
  onPlayExistingTTS,
  isPlayingTTS,
  currentPlayingText,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <ChatMessageItem
          key={message.id || index}
          message={message}
          formatted={{ mainText: message.text, romanizedText: message.romanizedText || '' }}
          index={index}
          isLastMessage={index === messages.length - 1}
          isLastAIMessage={index === messages.length - 1 && message.sender === 'AI'}
          toggleShortFeedback={onToggleShortFeedback}
          toggleDetailedFeedback={onToggleDetailedFeedback}
          generateTTSForText={(text, language, cacheKey) => onPlayTTS(text, language)}
          language={language}
          userPreferences={{}}
          playTTS={onPlayTTS}
          getTTSText={(message, romanizationDisplay) => message.text}
          isLoadingMessageFeedback={isLoadingMessageFeedback}
          isTranslating={isTranslating}
          isGeneratingTTS={{}}
          isPlayingTTS={{ [message.id || index]: isPlayingTTS && currentPlayingText === message.text }}
          quickTranslation={onQuickTranslation}
          handleSuggestionButtonClick={() => {}}
          isLoadingSuggestions={false}
          isDarkMode={isDarkMode}
          isProcessing={message.isProcessing || false}
          playExistingTTS={onPlayExistingTTS}
          showCorrectedVersions={{}}
          extractCorrectedVersion={(text) => ({ mainText: text, romanizedText: null })}
          renderFormattedText={(text) => text}
        />
      ))}
    </div>
  );
}
