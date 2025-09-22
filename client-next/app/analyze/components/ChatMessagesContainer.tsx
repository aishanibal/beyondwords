import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../types/analyze';

interface ChatMessagesContainerProps {
  chatHistory: ChatMessage[];
  isDarkMode: boolean;
  onMessageClick: (index: number, text: string) => void;
  onTranslateMessage: (messageIndex: number, text: string, breakdown?: boolean) => Promise<void>;
  onRequestDetailedFeedback: (messageIndex: number) => Promise<void>;
  onRequestShortFeedback: (messageIndex: number) => Promise<void>;
  onRequestDetailedBreakdown: (messageIndex: number) => Promise<void>;
  onToggleDetailedFeedback: (messageIndex: number) => void;
  onToggleShortFeedback: (messageIndex: number) => void;
  onQuickTranslation: (messageIndex: number, text: string) => Promise<void>;
  onExplainLLMResponse: (messageIndex: number, text: string) => Promise<void>;
  onPlayTTS: (text: string, language: string) => Promise<void>;
  onPlayExistingTTS: (ttsUrl: string) => void;
  translations: Record<number, { translation?: string; breakdown?: string; has_breakdown?: boolean }>;
  isTranslating: Record<number, boolean>;
  showTranslations: Record<number, boolean>;
  showDetailedBreakdown: {[key: number]: boolean};
  showSuggestionExplanations: {[key: number]: boolean};
  explainButtonPressed: boolean;
  parsedBreakdown: any[];
  feedbackExplanations: Record<number, Record<string, string>>;
  activePopup: { messageIndex: number; wordKey: string; position: { x: number; y: number } } | null;
  showCorrectedVersions: Record<number, boolean>;
  quickTranslations: Record<number, any>;
  showQuickTranslations: Record<number, boolean>;
  ttsCache: Map<string, { url: string; timestamp: number }>;
  isGeneratingTTS: {[key: string]: boolean};
  isPlayingTTS: {[key: string]: boolean};
  romanizationDisplay: string;
  language: string;
  messageCount: number;
  hasMoreMessages: boolean;
  isLoadingMoreMessages: boolean;
  loadMoreMessages: () => void;
  userPreferences: any;
}

const ESTIMATED_MESSAGE_HEIGHT = 200; // Estimated height per message

const ChatMessagesContainer: React.FC<ChatMessagesContainerProps> = ({
  chatHistory,
  isDarkMode,
  onMessageClick,
  onTranslateMessage,
  onRequestDetailedFeedback,
  onRequestShortFeedback,
  onRequestDetailedBreakdown,
  onToggleDetailedFeedback,
  onToggleShortFeedback,
  onQuickTranslation,
  onExplainLLMResponse,
  onPlayTTS,
  onPlayExistingTTS,
  translations,
  isTranslating,
  showTranslations,
  showDetailedBreakdown,
  showSuggestionExplanations,
  explainButtonPressed,
  parsedBreakdown,
  feedbackExplanations,
  activePopup,
  showCorrectedVersions,
  quickTranslations,
  showQuickTranslations,
  ttsCache,
  isGeneratingTTS,
  isPlayingTTS,
  romanizationDisplay,
  language,
  messageCount,
  hasMoreMessages,
  isLoadingMoreMessages,
  loadMoreMessages,
  userPreferences
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [virtualItems, setVirtualItems] = useState<{ index: number; start: number }[]>([]);
  const [totalHeight, setTotalHeight] = useState(0);

  // Format message for display
  const formatMessageForDisplay = (message: ChatMessage, romanizationDisplay: string, language: string) => {
    // This would contain the complex formatting logic from the original
    // For now, return a simple structure
    return {
      mainText: message.text,
      romanizedText: message.romanizedText
    };
  };

  // Effect to calculate virtual items based on scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const newVirtualItems: { index: number; start: number }[] = [];
      let currentHeight = 0;
      
      // Check if this is a continued conversation (has messages from original conversation)
      const hasOriginalMessages = chatHistory.some(msg => msg.isFromOriginalConversation);
      const isContinuedConversation = hasOriginalMessages && chatHistory.length > 0;
      
      // For continued conversations, immediately prioritize the last messages
      if (isContinuedConversation) {
        // Calculate the position where we want to start rendering (last 15 messages)
        const lastMessagesStart = Math.max(0, chatHistory.length - 15);
        
        // Render messages based on current scroll position with larger buffer
        for (let i = 0; i < chatHistory.length; i++) {
          const itemHeight = ESTIMATED_MESSAGE_HEIGHT;
          const messageTop = currentHeight;
          const messageBottom = currentHeight + itemHeight;
          
          // Render if it's in the last 15 messages OR in the current viewport with large buffer
          if (i >= lastMessagesStart || 
              (messageBottom > scrollTop - containerHeight * 2 && messageTop < scrollTop + containerHeight * 3)) {
            newVirtualItems.push({ index: i, start: currentHeight });
          }
          currentHeight += itemHeight;
        }
      } else {
        // Normal virtualization for new conversations with larger buffer
        for (let i = 0; i < chatHistory.length; i++) {
          const itemHeight = ESTIMATED_MESSAGE_HEIGHT;
          const messageTop = currentHeight;
          const messageBottom = currentHeight + itemHeight;
          
          // Render messages in viewport with larger buffer to prevent disappearing
          if (messageBottom > scrollTop - containerHeight && messageTop < scrollTop + containerHeight * 2) {
            newVirtualItems.push({ index: i, start: currentHeight });
          }
          currentHeight += itemHeight;
        }
      }
      
      // Calculate total height - ensure it doesn't create excess scroll space
      // If total content is less than container, use container height
      const finalHeight = Math.max(currentHeight, containerHeight);
      
      setVirtualItems(newVirtualItems);
      setTotalHeight(finalHeight);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [chatHistory]);

  // Effect to dynamically add padding to avoid overlap with controls
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      // Add padding to prevent last message from being hidden under controls
      chatContainer.style.paddingBottom = '144px'; // 120px controls + 24px padding
    }
  }, []);

  return (
    <div 
      ref={chatContainerRef}
      className="chat-messages-container"
      onScroll={(e) => {
        const target = e.target as HTMLDivElement;
        // Load more messages when user scrolls to the top
        if (target.scrollTop === 0 && hasMoreMessages && !isLoadingMoreMessages) {
          loadMoreMessages();
        }
      }}
      style={{
        padding: '1.5rem',
        overflowY: 'auto',
        flex: 1, // Take up remaining space
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: 0, // Allow flex item to shrink
        maxHeight: 'calc(100vh - 280px)' // Give more space for bottom controls
      }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {/* Loading indicators for pagination */}
        {isLoadingMoreMessages && (
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            padding: '1rem',
            textAlign: 'center',
            background: isDarkMode 
              ? 'rgba(30,41,59,0.8)' 
              : 'rgba(255,255,255,0.8)',
            borderRadius: '8px',
            marginBottom: '1rem',
            zIndex: 10
          }}>
            ⏳ Loading more messages...
          </div>
        )}
        
        {hasMoreMessages && messageCount > chatHistory.length && (
          <div style={{
            position: 'absolute',
            top: isLoadingMoreMessages ? '60px' : '0',
            left: '0',
            width: '100%',
            padding: '0.5rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: isDarkMode ? '#94a3b8' : '#6b7280',
            background: isDarkMode 
              ? 'rgba(30,41,59,0.6)' 
              : 'rgba(255,255,255,0.6)',
            borderRadius: '6px',
            marginBottom: '0.5rem',
            zIndex: 5
          }}>
            Showing {chatHistory.length} of {messageCount} messages • Scroll up to load more
          </div>
        )}
        
        {(() => {
          // Compute last AI message index once for this render batch
          const lastAIIndex = (() => {
            for (let i = chatHistory.length - 1; i >= 0; i--) {
              if (chatHistory[i]?.sender === 'AI') return i;
            }
            return -1;
          })();

          return virtualItems.map(({ index, start }) => {
            const message = chatHistory[index];
            if (!message) return null;

            const formatted = formatMessageForDisplay(message, romanizationDisplay, language);
            
            return (
              <div key={message.id || index} style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${start}px)`,
                height: ESTIMATED_MESSAGE_HEIGHT,
                padding: '0 0.5rem'
              }}>
                {/* Message content would go here */}
                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: message.sender === 'User' 
                    ? (isDarkMode ? '#3b5377' : '#e3f2fd')
                    : (isDarkMode ? '#1e293b' : '#f5f5f5'),
                  color: isDarkMode ? '#e2e8f0' : '#374151',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    {message.sender}
                  </div>
                  <div>{formatted.mainText}</div>
                  {formatted.romanizedText && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: isDarkMode ? '#94a3b8' : '#6b7280',
                      marginTop: '0.5rem',
                      fontStyle: 'italic'
                    }}>
                      {formatted.romanizedText}
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};

export default ChatMessagesContainer;
