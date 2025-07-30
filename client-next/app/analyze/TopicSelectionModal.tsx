/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [useCustomTopic, setUseCustomTopic] = useState<boolean>(false);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [customSubtopic, setCustomSubtopic] = useState<string>('');
  const [selectedFormality, setSelectedFormality] = useState<string>('friendly');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [savedPersonas, setSavedPersonas] = useState<any[]>([]);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasShownScenarios, setHasShownScenarios] = useState<boolean>(false);
  const [hasShownFormality, setHasShownFormality] = useState<boolean>(false);
  const [hasShownGoals, setHasShownGoals] = useState<boolean>(false);
  const [isUsingExistingPersona, setIsUsingExistingPersona] = useState<boolean>(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

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

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedSubtopics([]);
    setCustomSubtopic('');
    setIsUsingExistingPersona(false);
    setSelectedPersonaId(null);
    setError('');
  };

  const handleCustomTopicToggle = () => {
    setUseCustomTopic(!useCustomTopic);
    if (useCustomTopic) {
      setCustomTopic('');
      setCustomSubtopic('');
    }
    setSelectedTopic('');
    setSelectedSubtopics([]);
    setIsUsingExistingPersona(false);
    setSelectedPersonaId(null);
    setError('');
  };

  const handleSubtopicSelect = (subtopic: string) => {
    setSelectedSubtopics(prev => 
      prev.includes(subtopic) 
        ? prev.filter(s => s !== subtopic)
        : [...prev, subtopic]
    );
    setError('');
  };

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
    setError('');
  };

  // Check if scenarios section should be shown
  useEffect(() => {
    if (selectedTopic || (useCustomTopic && customTopic.trim())) {
      setHasShownScenarios(true);
    }
  }, [selectedTopic, useCustomTopic, customTopic]);

  // Check if formality section should be shown
  useEffect(() => {
    if (customSubtopic.trim() || selectedSubtopics.length > 0) {
      setHasShownFormality(true);
    }
  }, [customSubtopic, selectedSubtopics]);

  // Check if goals section should be shown
  useEffect(() => {
    // Only show goals after topic, scenarios, and formality are all selected
    const hasTopic = selectedTopic || (useCustomTopic && customTopic.trim());
    const hasScenarios = customSubtopic.trim() || selectedSubtopics.length > 0;
    const hasFormality = selectedFormality;
    
    if (hasTopic && hasScenarios && hasFormality) {
      setHasShownGoals(true);
    }
  }, [selectedTopic, useCustomTopic, customTopic, customSubtopic, selectedSubtopics, selectedFormality]);

  const handleStartConversation = async () => {
    if (!dashboardExists) {
      setError('No language dashboard found. Complete onboarding or add this language.');
      return;
    }
    
    // Collect all selected subtopics and custom subtopic
    const allSubtopics = [...selectedSubtopics];
    if (customSubtopic.trim()) {
      allSubtopics.push(customSubtopic);
    }
    
    if (allSubtopics.length === 0) {
      setError('Please select at least one scenario or enter a custom scenario.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt');
      const dashboardLanguage = currentDashboard?.language || currentLanguage || 'en';
      
      // Create description from selected subtopics
      const subtopicDescription = allSubtopics.join(', ');
      
      const response = await axios.post('/api/conversations', {
        language: dashboardLanguage,
        title: allSubtopics.length === 1 ? `${allSubtopics[0]} Discussion` : 'Multi-topic Discussion',
        topics: allSubtopics,
        formality: selectedFormality,
        learningGoals: selectedGoals,
        description: subtopicDescription,
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
          allSubtopics, 
          aiMessage, 
          selectedFormality, 
          selectedGoals,
          subtopicDescription,
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
        @media (max-width: 768px) {
          .modal-container {
            width: 95vw !important;
            max-width: 95vw !important;
            padding: 1rem !important;
          }
          .modal-content {
            font-size: 0.9rem !important;
          }
          .topic-grid {
            grid-template-columns: 1fr !important;
          }
          .formality-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .modal-container {
            width: 98vw !important;
            padding: 0.75rem !important;
          }
          .formality-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}>
        <div
          className="modal-container"
          style={{
            position: 'relative',
            background: '#fff',
            borderRadius: 20,
            padding: '1.5rem',
            boxShadow: '0 20px 60px rgba(60,76,115,0.25)',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{
              color: '#3c4c73',
              fontSize: '1.3rem',
              fontWeight: 700,
              marginBottom: '0.25rem',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}>
              Start a Practice Session
            </h2>
            <p style={{
              color: '#7e5a75',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>
              Choose your topic, scenarios, and conversation style
            </p>
          </div>

          {/* Saved Personas Section */}
          {savedPersonas.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                color: '#3c4c73',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                fontFamily: 'Montserrat, Arial, sans-serif',
                textAlign: 'center'
              }}>
                🎭 Your Saved Personas
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '0.5rem',
                maxHeight: '150px',
                overflowY: 'auto',
                padding: '0.25rem'
              }}>
                {savedPersonas.map((persona) => (
                  <div
                    key={persona.id}
                    onClick={() => {
                      // Load persona data into current selections
                      if (persona.topics && persona.topics.length > 0) {
                        setSelectedSubtopics(persona.topics);
                      }
                      if (persona.formality) {
                        setSelectedFormality(persona.formality);
                      }
                      // Mark that we're using an existing persona
                      setIsUsingExistingPersona(true);
                      setSelectedPersonaId(persona.id);
                      setError('');
                    }}
                    style={{
                      padding: '0.5rem',
                      border: `2px solid ${selectedPersonaId === persona.id ? '#7e5a75' : '#e9ecef'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: selectedPersonaId === persona.id ? 'rgba(126,90,117,0.1)' : '#fff',
                      borderColor: selectedPersonaId === persona.id ? '#7e5a75' : '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ fontSize: '1rem' }}>🎭</div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#3c4c73',
                        marginBottom: '0.1rem'
                      }}>
                        {persona.name}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#6c757d',
                        lineHeight: 1.2
                      }}>
                        {persona.description || 'No description'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              background: 'rgba(220,53,69,0.1)',
              color: '#dc3545',
              padding: '0.5rem',
              borderRadius: 8,
              marginBottom: '1rem',
              border: '1px solid rgba(220,53,69,0.2)',
              textAlign: 'center',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          {/* Dashboard missing warning */}
          {!dashboardExists && (
            <div style={{
              background: 'rgba(255, 215, 0, 0.15)',
              color: '#b8860b',
              padding: '0.75rem',
              borderRadius: 8,
              marginBottom: '1rem',
              border: '1px solid #ffe066',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}>
              No language dashboard found.<br />
              Complete onboarding or add this language in dashboard settings.
            </div>
          )}

          {/* 1. Topic Selection Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              color: '#3c4c73', 
              fontSize: '1rem', 
              fontWeight: 600, 
              marginBottom: '0.25rem'
            }}>
              📚 Choose Your Topic
            </h3>
            <p style={{ 
              color: '#7e5a75', 
              fontSize: '0.8rem', 
              marginBottom: '0.75rem',
              lineHeight: 1.3
            }}>
              Select one topic for this practice session
            </p>
            
            {/* Default Topics - Show first */}
            {!useCustomTopic && currentDashboard?.talk_topics && currentDashboard.talk_topics.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="topic-grid" style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.5rem',
                }}>
                  {currentDashboard.talk_topics.map((topicId: string) => {
                    const topic: Topic | undefined = TALK_TOPICS.find((t: Topic) => t.id === topicId);
                    if (!topic) return null;
                    
                    return (
                      <div
                        key={topic.id}
                        onClick={() => handleTopicSelect(topic.id)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: `2px solid ${selectedTopic === topic.id ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                          backgroundColor: selectedTopic === topic.id ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontWeight: 500,
                          color: '#3c4c73',
                          fontSize: '0.85rem',
                          minHeight: 45,
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>{topic.icon}</span> 
                        <span>{topic.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Topic Toggle */}
            <div style={{ marginBottom: '0.75rem' }}>
              <button
                onClick={handleCustomTopicToggle}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: `2px solid ${useCustomTopic ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                  backgroundColor: useCustomTopic ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 500,
                  color: '#3c4c73',
                  fontSize: '0.85rem'
                }}
              >
                <span>✍️</span> Use Custom Topic
              </button>
            </div>

            {/* Custom Topic Input - Show after custom toggle */}
            {useCustomTopic && (
              <div style={{ marginBottom: '0.75rem' }}>
                <h4 style={{
                  color: '#3c4c73',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '0.25rem'
                }}>
                  ✍️ Custom Topic
                </h4>
                <input
                  type="text"
                  placeholder="Enter your custom topic..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '2px solid rgba(126,90,117,0.3)',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    background: '#f8f6f4',
                    color: '#3c4c73'
                  }}
                  autoFocus
                />
              </div>
            )}

            {/* No topics available message */}
            {!useCustomTopic && (!currentDashboard?.talk_topics || currentDashboard.talk_topics.length === 0) && (
              <div style={{
                padding: '1rem',
                background: 'rgba(126,90,117,0.1)',
                borderRadius: '6px',
                textAlign: 'center',
                color: '#7e5a75',
                fontSize: '0.8rem'
              }}>
                No topics available. Add topics in dashboard settings.
              </div>
            )}
          </div>

          {/* 2. Scenario Selection Section - Show once topic is selected, then stay visible */}
          {hasShownScenarios && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                color: '#3c4c73', 
                fontSize: '1rem', 
                fontWeight: 600, 
                marginBottom: '0.25rem'
              }}>
                📝 Choose Scenarios
              </h3>
              <p style={{ 
                color: '#7e5a75', 
                fontSize: '0.8rem', 
                marginBottom: '0.75rem',
                lineHeight: 1.3
              }}>
                {useCustomTopic 
                  ? `Select scenarios for "${customTopic}"`
                  : `Select scenarios for "${TALK_TOPICS.find(t => t.id === selectedTopic)?.label}"`
                }
              </p>
              
              {/* Predefined Scenarios - Only show for default topics */}
              {!useCustomTopic && TALK_TOPICS.find(t => t.id === selectedTopic)?.subtopics && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem'
                  }}>
                    {TALK_TOPICS.find(t => t.id === selectedTopic)?.subtopics?.map((subtopic) => {
                      const isSelected = selectedSubtopics.includes(subtopic);
                      return (
                        <div
                          key={subtopic}
                          onClick={() => handleSubtopicSelect(subtopic)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: `2px solid ${isSelected ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                            backgroundColor: isSelected ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: '#3c4c73',
                          }}
                        >
                          {subtopic}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Scenario Input - Always available, now after suggestions */}
              <div style={{ marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Enter your custom scenario..."
                  value={customSubtopic}
                  onChange={(e) => setCustomSubtopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '2px solid rgba(126,90,117,0.3)',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    background: '#f8f6f4',
                    color: '#3c4c73'
                  }}
                />
              </div>
            </div>
          )}

          {/* 3. Formality Selection Section - Show once scenarios are selected, then stay visible */}
          {hasShownFormality && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#3c4c73', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                🏷️ Conversation Formality
              </h3>
              <p style={{ color: '#7e5a75', fontSize: '0.8rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                Set the conversation tone and formality level
              </p>
              <div className="formality-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.4rem'
              }}>
                {Object.entries(CLOSENESS_LEVELS).map(([key, desc]) => {
                  const iconMatch = desc.match(/([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])/);
                  const icon = iconMatch ? iconMatch[0] : '';
                  const label = desc.split(':')[0];
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedFormality(key)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: `2px solid ${selectedFormality === key ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                        backgroundColor: selectedFormality === key ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        boxShadow: selectedFormality === key ? '0 2px 8px rgba(126,90,117,0.12)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '1rem' }}>{icon}</div>
                      <div style={{ fontWeight: 600, color: '#3c4c73' }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Learning Goals Selection Section - Show once formality is selected, then stay visible */}
          {hasShownGoals && currentDashboard?.learning_goals && currentDashboard.learning_goals.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#3c4c73', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                🎯 Focus on Learning Goals
              </h3>
              <p style={{ color: '#7e5a75', fontSize: '0.8rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                Choose which skills you want to work on during this session
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem'
              }}>
                {currentDashboard.learning_goals.map((goalId: string) => {
                  const goal: LearningGoal | undefined = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
                  if (!goal) return null;
                  
                  return (
                    <div
                      key={goal.id}
                      onClick={() => handleGoalSelect(goal.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: `2px solid ${selectedGoals.includes(goal.id) ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                        backgroundColor: selectedGoals.includes(goal.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 500,
                        color: '#3c4c73',
                        fontSize: '0.85rem',
                        minHeight: 45,
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{goal.icon}</span> 
                      <span>{goal.goal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Button - Only show if all required fields are filled */}
          {((customSubtopic.trim()) || selectedSubtopics.length > 0) && selectedGoals.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={handleStartConversation}
                disabled={isLoading || !dashboardExists}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 10,
                  border: 'none',
                  background: isLoading || !dashboardExists ? '#ccc' : 
                             'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: isLoading || !dashboardExists ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: !isLoading && dashboardExists ? '0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15)' : 'none',
                  animation: !isLoading && dashboardExists ? 'glowPulse 1.8s infinite alternate' : 'none',
                }}
              >
                {isLoading ? '🔄 Starting...' : '🎤 Start Practice Session'}
              </button>
              <style>{`
                @keyframes glowPulse {
                  0% { box-shadow: 0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15); }
                  100% { box-shadow: 0 0 32px 8px #eec1d1, 0 8px 32px rgba(60,76,115,0.18); }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 