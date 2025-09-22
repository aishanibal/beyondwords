"use client";
export const dynamic = "force-dynamic";

import React, { useState, useRef, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useUser } from '../ClientLayout';
import { useDarkMode } from '../contexts/DarkModeContext';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import TopicSelectionModal from './TopicSelectionModal';
import PersonaModal from './PersonaModal';
import LoadingScreen from '../components/LoadingScreen';
import { LEARNING_GOALS, LearningGoal, getProgressiveSubgoalDescription, getSubgoalLevel, updateSubgoalProgress, SubgoalProgress, LevelUpEvent } from '../../lib/preferences';
import { getUserLanguageDashboards, getAuthHeaders } from '../../lib/api';

// Import our new modular components and hooks
import { usePersistentChatHistory } from './hooks/useChatHistory';
import { useAudioRecording } from './hooks/useAudioRecording';
import { useTTS } from './hooks/useTTS';
import { useTranslation } from './hooks/useTranslation';
import { useConversation } from './hooks/useConversation';
import { useAudioProcessing } from './hooks/useAudioProcessing';
import { useFeedback } from './hooks/useFeedback';
import MessageList from './components/MessageList';
import AudioControls from './components/AudioControls';
import TTSControls from './components/TTSControls';
import TranslationPanel from './components/TranslationPanel';

// Import types and utilities
import { ChatMessage, User, FormattedText, SuggestionData } from './types/analyze';
import { generateRomanizedText, formatScriptLanguageText, isScriptLanguage } from './utils/romanization';
import { cleanTextForTTS, getLanguageLabel } from './utils/textFormatting';

const AnalyzeContent = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading analyze page...</div>
      </div>
    );
  }
  
  return <AnalyzeContentInner />;
};

const AnalyzeContentInner = () => {
  const { user } = useUser();
  const { isDarkMode } = useDarkMode();
  const router = useRouter();

  // Use our custom hooks
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user);
  const audioRecording = useAudioRecording();
  const tts = useTTS();
  const translation = useTranslation();
  const conversation = useConversation(user);
  const audioProcessing = useAudioProcessing();
  const feedback = useFeedback();

  // UI state
  const [language, setLanguage] = useState<string>(user?.target_language || 'en');
  const [suggestions, setSuggestions] = useState<SuggestionData[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState<number>(0);
  const [showSuggestionCarousel, setShowSuggestionCarousel] = useState<boolean>(false);
  const [suggestionMessages, setSuggestionMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessageFeedback, setIsLoadingMessageFeedback] = useState<Record<number, boolean>>({});
  const [leftPanelWidth, setLeftPanelWidth] = useState(0.2);
  const [rightPanelWidth, setRightPanelWidth] = useState(0.2);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingPanel, setResizingPanel] = useState<'left' | 'right' | null>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [enableShortFeedback, setEnableShortFeedback] = useState<boolean>(true);
  const [shortFeedbacks, setShortFeedbacks] = useState<Record<number, string>>({});
  const [isProcessingShortFeedback, setIsProcessingShortFeedback] = useState<boolean>(false);
  const [isLoadingInitialAI, setIsLoadingInitialAI] = useState<boolean>(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [romanizationDisplay, setRomanizationDisplay] = useState<string>('none');
  const [showSavePrompt, setShowSavePrompt] = useState<boolean>(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Auth headers helper
  const getAuthHeaders = async () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Message handlers
  const handleMessageClick = (index: number, text: string) => {
    translation.handleMessageClick(index);
  };

  const handleTranslateMessage = async (messageIndex: number, text: string, breakdown = false) => {
    await translation.translateMessage(
      messageIndex, 
      text, 
      breakdown, 
      chatHistory, 
      language, 
      userPreferences, 
      user
    );
  };

  const handleRequestDetailedFeedback = async (messageIndex: number) => {
    await feedback.requestDetailedFeedbackForMessage(
      messageIndex,
      conversation.conversationId,
      chatHistory,
      language,
      userPreferences,
      conversation.fetchUserDashboardPreferences,
      setUserPreferences
    );
  };

  const handleRequestShortFeedback = async (messageIndex: number) => {
    await feedback.requestShortFeedbackForMessage(
      messageIndex,
      conversation.conversationId,
      chatHistory,
      language,
      userPreferences
    );
  };

  const handleRequestDetailedBreakdown = async (messageIndex: number) => {
    const message = chatHistory[messageIndex];
    if (message) {
      await translation.translateMessage(
        messageIndex,
        message.text,
        true, // breakdown = true
        chatHistory,
        language,
        userPreferences,
        user
      );
    }
  };

  const handleToggleDetailedFeedback = (messageIndex: number) => {
    // Implementation for toggling detailed feedback
    console.log('Toggle detailed feedback for message:', messageIndex);
  };

  const handleToggleShortFeedback = (messageIndex: number) => {
    // Implementation for toggling short feedback
    console.log('Toggle short feedback for message:', messageIndex);
  };

  const handleQuickTranslation = async (messageIndex: number, text: string) => {
    await translation.translateMessage(
      messageIndex,
      text,
      false, // breakdown = false
      chatHistory,
      language,
      userPreferences,
      user
    );
  };

  const handleExplainLLMResponse = async (messageIndex: number, text: string) => {
    await translation.explainSuggestion(
      messageIndex,
      text,
      chatHistory,
      language,
      userPreferences,
      user
    );
  };

  const handleAudioRecorded = async (audioBlob: Blob) => {
    await audioProcessing.sendAudioToBackend(
      audioBlob,
      language,
      conversation.conversationId,
      chatHistory,
      setChatHistory,
      conversation.saveMessageToBackend,
      autoSpeak,
      enableShortFeedback,
      (transcription: string, detectedLanguage?: string) => 
        feedback.fetchAndShowShortFeedback(
          transcription,
          detectedLanguage || language,
          language,
          chatHistory,
          userPreferences,
          autoSpeak,
          enableShortFeedback,
          setChatHistory,
          tts.playTTSAudio
        )
    );
  };

  const handlePlayTTS = (text: string, language: string) => {
    const cacheKey = `${language}_${text.substring(0, 50)}`;
    tts.playTTSAudio(text, language, cacheKey);
  };

  const handlePlayExistingTTS = (ttsUrl: string) => {
    tts.playExistingTTS(ttsUrl, 'existing');
  };

  const handleStartRecording = async () => {
    const success = await audioRecording.startRecording(language, autoSpeak);
    if (success) {
      console.log('Recording started');
    }
  };

  const handleStopRecording = () => {
    audioRecording.stopRecording();
    const audioBlob = audioRecording.getAudioBlob();
    if (audioBlob) {
      handleAudioRecorded(audioBlob);
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!user) {
    return <LoadingScreen />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen">
        {/* Left Panel */}
        <div 
          ref={leftPanelRef}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-r border-gray-300`}
          style={{ width: `${leftPanelWidth * 100}%` }}
        >
          <div className="p-4">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Chat History
            </h2>
            <MessageList
              messages={chatHistory}
              onMessageClick={handleMessageClick}
              onTranslateMessage={handleTranslateMessage}
              onRequestDetailedFeedback={handleRequestDetailedFeedback}
              onRequestShortFeedback={handleRequestShortFeedback}
              onRequestDetailedBreakdown={handleRequestDetailedBreakdown}
              onToggleDetailedFeedback={handleToggleDetailedFeedback}
              onToggleShortFeedback={handleToggleShortFeedback}
              onQuickTranslation={handleQuickTranslation}
              onExplainLLMResponse={handleExplainLLMResponse}
              translations={translation.translations}
              isTranslating={translation.isTranslating}
              showTranslations={translation.showTranslations}
              suggestionTranslations={translation.suggestionTranslations}
              isTranslatingSuggestion={translation.isTranslatingSuggestion}
              showSuggestionTranslations={translation.showSuggestionTranslations}
              isLoadingMessageFeedback={isLoadingMessageFeedback}
              shortFeedbacks={shortFeedbacks}
              romanizationDisplay={romanizationDisplay}
              language={language}
              isDarkMode={isDarkMode}
              onPlayTTS={handlePlayTTS}
              onPlayExistingTTS={handlePlayExistingTTS}
              isPlayingTTS={tts.isPlaying}
              currentPlayingText={tts.currentPlayingText}
            />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <MessageList
                  messages={chatHistory}
                  onMessageClick={handleMessageClick}
                  onTranslateMessage={handleTranslateMessage}
                  onRequestDetailedFeedback={handleRequestDetailedFeedback}
                  onRequestShortFeedback={handleRequestShortFeedback}
                  onRequestDetailedBreakdown={handleRequestDetailedBreakdown}
                  onToggleDetailedFeedback={handleToggleDetailedFeedback}
                  onToggleShortFeedback={handleToggleShortFeedback}
                  onQuickTranslation={handleQuickTranslation}
                  onExplainLLMResponse={handleExplainLLMResponse}
                  translations={translation.translations}
                  isTranslating={translation.isTranslating}
                  showTranslations={translation.showTranslations}
                  suggestionTranslations={translation.suggestionTranslations}
                  isTranslatingSuggestion={translation.isTranslatingSuggestion}
                  showSuggestionTranslations={translation.showSuggestionTranslations}
                  isLoadingMessageFeedback={feedback.isLoadingMessageFeedback}
                  shortFeedbacks={feedback.shortFeedbacks}
                  romanizationDisplay={romanizationDisplay}
                  language={language}
                  isDarkMode={isDarkMode}
                  onPlayTTS={handlePlayTTS}
                  onPlayExistingTTS={handlePlayExistingTTS}
                  isPlayingTTS={tts.isPlaying}
                  currentPlayingText={tts.currentPlayingText}
                  isPlayingAnyTTS={tts.isPlayingAnyTTS}
                  isGeneratingTTS={tts.isGeneratingTTS}
                />
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className={`border-t p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                <div className="flex items-center space-x-2">
                  <AudioControls
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    onAudioRecorded={handleAudioRecorded}
                    isRecording={audioRecording.isRecording}
                    isPaused={audioRecording.isPaused}
                    wasInterrupted={audioRecording.wasInterrupted}
                    isDarkMode={isDarkMode}
                  />
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                  
                  <button
                    className={`px-4 py-2 rounded-lg font-medium ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div 
          ref={rightPanelRef}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-l border-gray-300`}
          style={{ width: `${rightPanelWidth * 100}%` }}
        >
          <div className="p-4">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Translation & Feedback
            </h2>
            {/* Translation panel content would go here */}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTopicModal && (
        <TopicSelectionModal
          isOpen={showTopicModal}
          onClose={() => setShowTopicModal(false)}
          onStartConversation={(id, topics, aiMessage, formality, learningGoals, description, isUsingExistingPersona) => {
            console.log('Start conversation:', { id, topics, aiMessage, formality, learningGoals, description, isUsingExistingPersona });
            setShowTopicModal(false);
          }}
        />
      )}

      {showPersonaModal && (
        <PersonaModal
          isOpen={showPersonaModal}
          onClose={() => setShowPersonaModal(false)}
          onSave={async (personaName) => {
            console.log('Save persona:', personaName);
            setShowPersonaModal(false);
          }}
          isSaving={isSavingPersona}
          currentTopics={userPreferences?.topics || []}
          currentDescription={conversation.conversationDescription}
          currentFormality={userPreferences?.formality || 'neutral'}
        />
      )}
    </div>
  );
};

export default AnalyzeContent;
