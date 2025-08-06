/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TALK_TOPICS, CLOSENESS_LEVELS, LEARNING_GOALS, Topic, LearningGoal } from '../../lib/preferences';

interface TopicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (id: string, topics: string[], aiMessage: any, formality: string, learningGoals: string[], description?: string, isUsingExistingPersona?: boolean) => void;
  currentLanguage?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem('jwt');
  return { Authorization: `Bearer ${token}` };
}

export default function TopicSelectionModal({ isOpen, onClose, onStartConversation, currentLanguage }: TopicSelectionModalProps) {
  const [currentDashboard, setCurrentDashboard] = useState<any>(null);
  const [dashboardExists, setDashboardExists] = useState<boolean>(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [useCustomTopic, setUseCustomTopic] = useState<boolean>(false);
  const [useCustomSubtopic, setUseCustomSubtopic] = useState<boolean>(false);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [customSubtopic, setCustomSubtopic] = useState<string>('');
  const [selectedFormality, setSelectedFormality] = useState<string>('friendly');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [savedPersonas, setSavedPersonas] = useState<any[]>([]);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasShownScenarios, setHasShownScenarios] = useState<boolean>(false);
  const [hasShownFormality, setHasShownFormality] = useState<boolean>(false);
  const [hasShownGoals, setHasShownGoals] = useState<boolean>(false);
  const [isUsingExistingPersona, setIsUsingExistingPersona] = useState<boolean>(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [modalRef, setModalRef] = useState<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (modalRef) {
      setTimeout(() => {
        modalRef.scrollTo({
          top: modalRef.scrollHeight,
          behavior: 'smooth'
        });
      }, 200); // Increased delay for better reliability
    }
  }, [modalRef]);

  const scrollToBottomWithDelay = useCallback((delay: number = 200) => {
    if (modalRef) {
      setTimeout(() => {
        modalRef.scrollTo({
          top: modalRef.scrollHeight,
          behavior: 'smooth'
        });
      }, delay);
    }
  }, [modalRef]);

  const fetchLanguageDashboard = useCallback(async () => {
    if (!currentLanguage) return;
    
    try {
      const response = await axios.get(`/api/user/language-dashboards`, { headers: getAuthHeaders() });
      const dashboards = response.data.dashboards || [];
      const dashboard = dashboards.find((d: any) => d.language === currentLanguage);
      
      if (dashboard) {
        setCurrentDashboard(dashboard);
        setDashboardExists(true);
      } else {
        setDashboardExists(false);
      }
    } catch (err: any) {
      console.error('Error fetching language dashboard:', err);
      setDashboardExists(false);
    }
  }, [currentLanguage]);

  const fetchSavedPersonas = useCallback(async () => {
    setIsLoadingPersonas(true);
    try {
      const response = await axios.get('/api/personas', { headers: getAuthHeaders() });
      setSavedPersonas(response.data.personas || []);
    } catch (err: any) {
      console.error('Error fetching saved personas:', err);
    } finally {
      setIsLoadingPersonas(false);
    }
  }, []);

  useEffect(() => {
    if (currentLanguage && isOpen) {
      fetchLanguageDashboard();
      fetchSavedPersonas();
    }
  }, [currentLanguage, isOpen, fetchLanguageDashboard, fetchSavedPersonas]);

  // Handle persona selection with auto-fill functionality
  const handlePersonaSelect = (persona: any) => {
    // Auto-fill topics/scenarios
    if (persona.topics && persona.topics.length > 0) {
      setSelectedSubtopic(persona.topics[0]); // Take first topic only
      setCustomSubtopic('');
      setUseCustomSubtopic(false);
      setHasShownScenarios(true);
    }
    
    // Auto-fill formality
    if (persona.formality) {
      setSelectedFormality(persona.formality);
      setHasShownFormality(true);
    }
    
    // Auto-fill topic if it matches a predefined topic
    if (persona.topics && persona.topics.length > 0) {
      const firstTopic = persona.topics[0];
      const matchingTopic = TALK_TOPICS.find(topic => 
        topic.subtopics?.some(subtopic => 
          subtopic.toLowerCase().includes(firstTopic.toLowerCase()) ||
          firstTopic.toLowerCase().includes(subtopic.toLowerCase())
        )
      );
      if (matchingTopic) {
        setSelectedTopic(matchingTopic.id);
        setUseCustomTopic(false);
        setCustomTopic('');
      } else {
        // If no matching predefined topic, set as custom
        setUseCustomTopic(true);
        setCustomTopic(firstTopic);
        setSelectedTopic('');
      }
    }
    
    // Mark that we're using an existing persona
    setIsUsingExistingPersona(true);
    setSelectedPersonaId(persona.id);
    setError('');
    
    // Show goals section since we have topic, scenarios, and formality
    setHasShownGoals(true);
  };

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    // Clear custom topic when selecting a predefined topic
    setCustomTopic('');
    setUseCustomTopic(false);
    setSelectedSubtopic('');
    setCustomSubtopic('');
    setUseCustomSubtopic(false);
    setIsUsingExistingPersona(false);
    setSelectedPersonaId(null);
    setError('');
  };

  const handleCustomTopicToggle = () => {
    if (useCustomTopic) {
      // If custom topic is already active, turn it off
      setUseCustomTopic(false);
      setCustomTopic('');
      setCustomSubtopic('');
      setUseCustomSubtopic(false);
    } else {
      // Turn on custom topic and clear predefined topic
      setUseCustomTopic(true);
      setSelectedTopic('');
    }
    setSelectedSubtopic('');
    setIsUsingExistingPersona(false);
    setSelectedPersonaId(null);
    setError('');
  };

  const handleSubtopicSelect = (subtopic: string) => {
    setSelectedSubtopic(subtopic);
    setCustomSubtopic('');
    setUseCustomSubtopic(false);
    setError('');
  };

  const handleCustomSubtopicToggle = () => {
    setUseCustomSubtopic(!useCustomSubtopic);
    if (useCustomSubtopic) {
      setCustomSubtopic('');
    }
    setSelectedSubtopic('');
    setError('');
  };

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    setError('');
  };

  // Check if scenarios section should be shown
  useEffect(() => {
    const hasValidTopic = selectedTopic || (useCustomTopic && customTopic.trim());
    if (hasValidTopic) {
      setHasShownScenarios(true);
      // Auto-scroll when scenarios section is shown
      scrollToBottomWithDelay(300);
    } else {
      setHasShownScenarios(false);
      // Clear scenario selections when topic is deselected
      setSelectedSubtopic('');
      setCustomSubtopic('');
      setUseCustomSubtopic(false);
    }
  }, [selectedTopic, useCustomTopic, customTopic, scrollToBottomWithDelay]);

  // Check if formality section should be shown
  useEffect(() => {
    const hasValidTopic = selectedTopic || (useCustomTopic && customTopic.trim());
    const hasValidScenario = customSubtopic.trim() || selectedSubtopic;
    
    if (hasValidTopic && hasValidScenario) {
      setHasShownFormality(true);
      // Auto-scroll when formality section is shown
      scrollToBottomWithDelay(300);
    } else {
      setHasShownFormality(false);
      // Clear formality when scenario is deselected
      setSelectedFormality('friendly');
    }
  }, [selectedTopic, useCustomTopic, customTopic, customSubtopic, selectedSubtopic, scrollToBottomWithDelay]);

  // Check if goals section should be shown
  useEffect(() => {
    // Only show goals after topic, scenarios, and formality are all selected
    const hasValidTopic = selectedTopic || (useCustomTopic && customTopic.trim());
    const hasValidScenario = customSubtopic.trim() || selectedSubtopic;
    const hasFormality = selectedFormality;
    
    if (hasValidTopic && hasValidScenario && hasFormality) {
      setHasShownGoals(true);
      // Auto-scroll when goals section is shown
      scrollToBottomWithDelay(300);
    } else {
      setHasShownGoals(false);
      // Clear goals when any previous step is deselected
      setSelectedGoal('');
    }
  }, [selectedTopic, useCustomTopic, customTopic, customSubtopic, selectedSubtopic, selectedFormality, scrollToBottomWithDelay]);

  // Check if action button should be shown
  useEffect(() => {
    const hasValidScenario = customSubtopic.trim() || selectedSubtopic;
    const hasValidGoal = selectedGoal;
    
    if (hasValidScenario && hasValidGoal) {
      // Auto-scroll when action button is shown
      scrollToBottomWithDelay(300);
    }
  }, [customSubtopic, selectedSubtopic, selectedGoal, scrollToBottomWithDelay]);

  // Auto-scroll when custom topic is expanded
  useEffect(() => {
    if (useCustomTopic) {
      scrollToBottomWithDelay(400);
    }
  }, [useCustomTopic, scrollToBottomWithDelay]);

  // Auto-scroll when custom scenario is expanded
  useEffect(() => {
    if (useCustomSubtopic) {
      scrollToBottomWithDelay(400);
    }
  }, [useCustomSubtopic, scrollToBottomWithDelay]);

  const handleStartConversation = async () => {
    if (!dashboardExists) {
      setError('No language dashboard found. Complete onboarding or add this language.');
      return;
    }
    
    // Collect the selected subtopic or custom subtopic
    const finalSubtopic = customSubtopic.trim() || selectedSubtopic;
    
    if (!finalSubtopic) {
      setError('Please select at least one scenario or enter a custom scenario.');
      return;
    }
    
    if (!selectedGoal) {
      setError('Please select a learning goal.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt');
      const dashboardLanguage = currentDashboard?.language || currentLanguage || 'en';
      
      const response = await axios.post('/api/conversations', {
        language: dashboardLanguage,
        title: `${finalSubtopic} Discussion`,
        topics: [finalSubtopic],
        formality: selectedFormality,
        learningGoals: [selectedGoal],
        description: finalSubtopic,
        usesPersona: false,
        personaId: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { conversation, aiMessage } = response.data;
      if (!conversation || !conversation.id) {
        setError('Failed to create conversation. Check your language dashboard.');
        setIsLoading(false);
        return;
      }
      let verified = null;
      for (let i = 0; i < 5; i++) {
        try {
          const fetchRes = await axios.get(`/api/conversations/${conversation.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (fetchRes.data && fetchRes.data.conversation) {
            verified = fetchRes.data.conversation;
            break;
          }
        } catch (e) {
          await new Promise(res => setTimeout(res, 300));
        }
      }
      if (verified) {
        // Start the conversation directly without showing persona modal
        onStartConversation(
          conversation.id, 
          [finalSubtopic], 
          aiMessage, 
          selectedFormality, 
          [selectedGoal],
          finalSubtopic,
          isUsingExistingPersona
        );
        onClose();
      } else {
        setError('Failed to verify conversation. Try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError('Failed to start conversation. Try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--rose-accent);
          border-radius: 4px;
          transition: background-color 0.3s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--rose-primary);
        }
        
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
        
        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--rose-accent) transparent;
        }
        
        /* Dark mode adjustments */
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--rose-accent);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--rose-primary);
        }
      `}</style>
      <AnimatePresence>
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={onClose}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          layout
          style={{
            position: 'relative',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '2rem',
            width: '700px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            // Custom scrollbar styling
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--rose-accent) transparent'
          }}
          className="custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
          ref={setModalRef}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--muted-foreground)';
            }}
          >
            ×
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{
              color: 'var(--foreground)',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              fontFamily: 'Gabriela, Arial, sans-serif'
            }}>
              Start a Practice Session
            </h2>
            <p style={{
              color: 'var(--muted-foreground)',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>
              Choose your topic, scenario, and conversation style
            </p>
          </div>

          {/* Saved Personas Section - Moved up and made more compact */}
          <AnimatePresence>
            {savedPersonas.length > 0 && (
              <motion.div
                key="saved-personas"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                layout
                style={{ marginBottom: '1.5rem', overflow: 'hidden' }}
              >
                <h3 style={{
                  color: 'var(--foreground)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  🎭 Your Saved Personas
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  overflowX: 'auto',
                  padding: '0.75rem',
                  maxHeight: '120px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--rose-accent) transparent'
                }}>
                  {savedPersonas.map((persona) => (
                    <motion.div
                      key={persona.id}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePersonaSelect(persona)}
                                              style={{
                          minWidth: '100px',
                          maxWidth: '100px',
                          background: selectedPersonaId === persona.id ? 'rgba(126, 90, 117, 0.08)' : 'rgba(126,90,117,0.05)',
                          borderRadius: 12,
                          padding: '0.75rem',
                          border: `2px solid ${selectedPersonaId === persona.id ? 'var(--rose-primary)' : 'rgba(126,90,117,0.1)'}`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: selectedPersonaId === persona.id ? '0 6px 20px rgba(126,90,117,0.2)' : '0 3px 10px rgba(0, 0, 0, 0.12)',
                          margin: '0 0.15rem'
                        }}
                    >
                      {/* Profile Icon */}
                      <div style={{ 
                        width: '32px',
                        height: '32px', 
                        borderRadius: '50%', 
                        background: selectedPersonaId === persona.id 
                          ? 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)'
                          : 'linear-gradient(135deg, rgba(126,90,117,0.8) 0%, rgba(138,106,122,0.8) 100%)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 0.5rem auto',
                        fontSize: '0.9rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontFamily: 'Montserrat, Arial, sans-serif',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}>
                        {persona.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Persona Name */}
                      <div style={{ 
                        textAlign: 'center',
                        fontWeight: 600, 
                        color: selectedPersonaId === persona.id ? 'var(--rose-primary)' : 'var(--foreground)',
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem',
                        fontFamily: 'Montserrat, Arial, sans-serif',
                        transition: 'color 0.3s ease',
                        lineHeight: 1.2
                      }}>
                        {persona.name}
                      </div>
                      
                      {/* Description Preview */}
                      <div style={{
                        fontSize: '0.6rem',
                        color: 'var(--muted-foreground)',
                        lineHeight: 1.2,
                        fontFamily: 'AR One Sans, Arial, sans-serif',
                        textAlign: 'center',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {persona.description || 'No description'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error-message"
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                layout
                style={{
                  background: 'rgba(220,53,69,0.1)',
                  color: '#dc3545',
                  padding: '0.75rem',
                  borderRadius: 12,
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(220,53,69,0.2)',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  fontFamily: 'AR One Sans, Arial, sans-serif',
                  overflow: 'hidden'
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dashboard missing warning */}
          <AnimatePresence>
            {!dashboardExists && (
              <motion.div
                key="dashboard-warning"
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                layout
                style={{
                  background: 'rgba(255, 215, 0, 0.15)',
                  color: '#b8860b',
                  padding: '1rem',
                  borderRadius: 12,
                  marginBottom: '1.5rem',
                  border: '1px solid #ffe066',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  fontFamily: 'AR One Sans, Arial, sans-serif',
                  overflow: 'hidden'
                }}
              >
                No language dashboard found.<br />
                Complete onboarding or add this language in dashboard settings.
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. Topic Selection Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            layout
            style={{ marginBottom: '2rem' }}
          >
            <h3 style={{ 
              color: 'var(--foreground)', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              marginBottom: '0.5rem',
              fontFamily: 'Montserrat, Arial, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📚 Choose Your Topic
            </h3>
            <p style={{ 
              color: 'var(--muted-foreground)', 
              fontSize: '0.85rem', 
              marginBottom: '1rem',
              lineHeight: 1.4,
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>
              Select one topic for this practice session
            </p>
            
            {/* Default Topics - Show first */}
            {currentDashboard?.talk_topics && currentDashboard.talk_topics.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                }}>
                  {currentDashboard.talk_topics.map((topicId: string) => {
                    const topic: Topic | undefined = TALK_TOPICS.find((t: Topic) => t.id === topicId);
                    if (!topic) return null;
                    
                    return (
                      <motion.div
                        key={topic.id}
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTopicSelect(topic.id)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--foreground)',
                          fontSize: '0.85rem',
                          minHeight: '50px',
                          fontFamily: 'Montserrat, Arial, sans-serif',
                          border: `2px solid ${selectedTopic === topic.id ? 'var(--rose-primary)' : 'transparent'}`,
                          background: selectedTopic === topic.id ? 'rgba(126, 90, 117, 0.05)' : 'var(--card)',
                          boxShadow: selectedTopic === topic.id ? '0 4px 16px rgba(126, 90, 117, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{topic.icon}</span> 
                        <span>{topic.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Topic Toggle */}
            <div style={{ marginBottom: '1rem' }}>
              <motion.div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 12,
                  border: `2px solid ${useCustomTopic ? 'var(--rose-primary)' : 'transparent'}`,
                  background: useCustomTopic ? 'rgba(126, 90, 117, 0.05)' : 'var(--card)',
                  boxShadow: useCustomTopic ? '0 4px 16px rgba(126, 90, 117, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
              >
                                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCustomTopicToggle}
                        style={{
                          padding: '0.6rem 0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.6rem',
                          fontWeight: 500,
                          color: 'var(--foreground)',
                          fontSize: '0.85rem',
                          fontFamily: 'Montserrat, Arial, sans-serif',
                          background: 'transparent',
                          border: 'none',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease'
                        }}
                      >
                  <span style={{ fontSize: '1.1rem' }}>✍️</span> Use Custom Topic
                </motion.button>
                
                <AnimatePresence>
                  {useCustomTopic && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <input
                        type="text"
                        placeholder="Enter your custom topic..."
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        style={{
                          padding: '0.6rem 0.8rem',
                          border: 'none',
                          fontSize: '0.85rem',
                          fontFamily: 'inherit',
                          background: 'transparent',
                          color: 'var(--foreground)',
                          outline: 'none',
                          minWidth: '200px',
                          width: '100%'
                        }}
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* No topics available message */}
            {!useCustomTopic && (!currentDashboard?.talk_topics || currentDashboard.talk_topics.length === 0) && (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(126,90,117,0.05)',
                borderRadius: 12,
                textAlign: 'center',
                color: 'var(--muted-foreground)',
                fontSize: '0.85rem',
                fontFamily: 'AR One Sans, Arial, sans-serif',
                border: '1px solid var(--border)'
              }}>
                No topics available. Add topics in dashboard settings.
              </div>
            )}
          </motion.div>

          {/* 2. Scenario Selection Section - Show once topic is selected, then stay visible */}
          <AnimatePresence>
            {hasShownScenarios && (
              <motion.div
                key="scenarios-section"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                layout
                style={{ marginBottom: '2rem', overflow: 'hidden' }}
              >
                <h3 style={{ 
                  color: 'var(--foreground)', 
                  fontSize: '1.1rem', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem',
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📝 Choose Scenario
                </h3>
                <p style={{ 
                  color: 'var(--muted-foreground)', 
                  fontSize: '0.85rem', 
                  marginBottom: '1rem',
                  lineHeight: 1.4,
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }}>
                  {useCustomTopic && customTopic.trim()
                    ? `Select a scenario for "${customTopic}"`
                    : selectedTopic
                    ? `Select a scenario for "${TALK_TOPICS.find(t => t.id === selectedTopic)?.label}"`
                    : 'Select a topic first to choose scenarios'
                  }
                </p>
                
                {/* Predefined Scenarios - Only show for default topics */}
                {selectedTopic && TALK_TOPICS.find(t => t.id === selectedTopic)?.subtopics && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {TALK_TOPICS.find(t => t.id === selectedTopic)?.subtopics?.map((subtopic) => {
                        const isSelected = selectedSubtopic === subtopic;
                        return (
                          <motion.div
                            key={subtopic}
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSubtopicSelect(subtopic)}
                            style={{
                              padding: '0.75rem',
                              borderRadius: 12,
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              color: 'var(--foreground)',
                              fontFamily: 'Montserrat, Arial, sans-serif',
                              border: `2px solid ${isSelected ? 'var(--rose-primary)' : 'transparent'}`,
                              background: isSelected ? 'rgba(126, 90, 117, 0.05)' : 'var(--card)',
                              boxShadow: isSelected ? '0 4px 16px rgba(126, 90, 117, 0.15)' : '0 3px 10px rgba(0, 0, 0, 0.12)',
                              transition: 'all 0.2s ease',
                              textAlign: 'center',
                              minHeight: '50px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {subtopic}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Scenario Toggle - Only show if there's a selected topic */}
                {(selectedTopic || (useCustomTopic && customTopic.trim())) && (
                  <div style={{ marginBottom: '1rem' }}>
                    <motion.div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: 12,
                        border: `2px solid ${useCustomSubtopic ? 'var(--rose-primary)' : 'transparent'}`,
                        background: useCustomSubtopic ? 'rgba(126, 90, 117, 0.05)' : 'var(--card)',
                        boxShadow: useCustomSubtopic ? '0 4px 16px rgba(126, 90, 117, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'hidden'
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCustomSubtopicToggle}
                        style={{
                          padding: '0.6rem 0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.6rem',
                          fontWeight: 500,
                          color: 'var(--foreground)',
                          fontSize: '0.85rem',
                          fontFamily: 'Montserrat, Arial, sans-serif',
                          background: 'transparent',
                          border: 'none',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>✍️</span> Use Custom Scenario
                      </motion.button>
                      
                      <AnimatePresence>
                        {useCustomSubtopic && (
                          <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <input
                              type="text"
                              placeholder="Enter your custom scenario..."
                              value={customSubtopic}
                              onChange={(e) => setCustomSubtopic(e.target.value)}
                              style={{
                                padding: '0.6rem 0.8rem',
                                border: 'none',
                                fontSize: '0.85rem',
                                fontFamily: 'inherit',
                                background: 'transparent',
                                color: 'var(--foreground)',
                                outline: 'none',
                                minWidth: '200px',
                                width: '100%'
                              }}
                              autoFocus
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. Formality Selection Section - Show once scenarios are selected, then stay visible */}
          <AnimatePresence>
            {hasShownFormality && (
              <motion.div
                key="formality-section"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                layout
                style={{ marginBottom: '2rem', overflow: 'hidden' }}
              >
                <h3 style={{ 
                  color: 'var(--foreground)', 
                  fontSize: '1.1rem', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem',
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🏷️ Conversation Formality
                </h3>
                <p style={{ 
                  color: 'var(--muted-foreground)', 
                  fontSize: '0.85rem', 
                  marginBottom: '1rem', 
                  lineHeight: 1.4,
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }}>
                  Set the conversation tone and formality level
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {Object.entries(CLOSENESS_LEVELS).map(([key, desc]) => {
                    const iconMatch = desc.match(/([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])/);
                    const icon = iconMatch ? iconMatch[0] : '';
                    const label = desc.split(':')[0];
                    return (
                      <motion.div
                        key={key}
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedFormality(key)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.6rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: 'var(--foreground)',
                          fontFamily: 'Montserrat, Arial, sans-serif',
                          border: `2px solid ${selectedFormality === key ? 'var(--rose-primary)' : 'transparent'}`,
                          background: selectedFormality === key ? 'rgba(126, 90, 117, 0.05)' : 'var(--card)',
                          boxShadow: selectedFormality === key ? '0 4px 16px rgba(126, 90, 117, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.2s ease',
                          minHeight: '50px'
                        }}
                      >
                        <div style={{ fontSize: '1.1rem' }}>{icon}</div>
                        <div style={{ fontWeight: 600 }}>{label}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4. Learning Goals Selection Section - Show once formality is selected, then stay visible */}
          <AnimatePresence>
            {hasShownGoals && currentDashboard?.learning_goals && currentDashboard.learning_goals.length > 0 && (
              <motion.div
                key="goals-section"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                layout
                style={{ marginBottom: '2rem', overflow: 'hidden' }}
              >
                <h3 style={{ 
                  color: 'var(--foreground)', 
                  fontSize: '1.1rem', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem',
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🎯 Focus on Learning Goal
                </h3>
                <p style={{ 
                  color: 'var(--muted-foreground)', 
                  fontSize: '0.85rem', 
                  marginBottom: '1rem', 
                  lineHeight: 1.4,
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }}>
                  Choose which skill you want to work on during this session
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {currentDashboard.learning_goals.map((goalId: string) => {
                    const goal: LearningGoal | undefined = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
                    if (!goal) return null;
                    
                    return (
                      <motion.div
                        key={goal.id}
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGoalSelect(goal.id)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--foreground)',
                          fontSize: '0.85rem',
                          minHeight: '50px',
                          fontFamily: 'Montserrat, Arial, sans-serif',
                          border: `2px solid ${selectedGoal === goal.id ? 'var(--rose-primary)' : 'transparent'}`,
                          background: selectedGoal === goal.id ? 'rgba(126, 90, 117, 0.05)' : 'var(--card)',
                          boxShadow: selectedGoal === goal.id ? '0 4px 16px rgba(126, 90, 117, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{goal.icon}</span> 
                        <span>{goal.goal}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button - Only show if all required fields are filled */}
          <AnimatePresence>
            {(customSubtopic.trim() || selectedSubtopic) && selectedGoal && (
              <motion.div
                key="action-button"
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                layout
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  marginTop: '2rem',
                  overflow: 'hidden'
                }}
              >
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartConversation}
                  disabled={isLoading || !dashboardExists}
                  style={{
                    padding: '0.8rem 1.5rem',
                    borderRadius: 16,
                    border: 'none',
                    background: isLoading || !dashboardExists ? 'var(--muted)' : 
                               'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: isLoading || !dashboardExists ? 'not-allowed' : 'pointer',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                    minWidth: '180px',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isLoading ? '🔄 Starting...' : '🎤 Start Practice Session'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      </AnimatePresence>
    </>
  );
} 