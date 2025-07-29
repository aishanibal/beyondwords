/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TALK_TOPICS, CLOSENESS_LEVELS } from '../../lib/preferences';

interface Topic {
  id: string;
  label: string;
  icon: string;
}

interface TopicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (id: string, topics: string[], aiMessage: any, formality: string, description?: string) => void;
  currentLanguage?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem('jwt');
  return { Authorization: `Bearer ${token}` };
}

export default function TopicSelectionModal({ isOpen, onClose, onStartConversation, currentLanguage }: TopicSelectionModalProps) {
  const [currentDashboard, setCurrentDashboard] = useState<any>(null);
  const [dashboardExists, setDashboardExists] = useState<boolean>(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [useCustomTopic, setUseCustomTopic] = useState<boolean>(false);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [selectedFormality, setSelectedFormality] = useState<string>('friendly');
  const [hasProgressed, setHasProgressed] = useState(false);
  const [conversationDescription, setConversationDescription] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [savedPersonas, setSavedPersonas] = useState<any[]>([]);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Default personas for different conversation types
  const DEFAULT_PERSONAS = [
    {
      id: 'travel_buddy',
      name: 'Travel Buddy',
      description: 'A friendly local who loves sharing travel tips, restaurant recommendations, and cultural insights',
      icon: '✈️',
      formality: 'friendly'
    },
    {
      id: 'language_exchange_partner',
      name: 'Language Exchange Partner',
      description: 'A patient conversation partner who helps you practice and corrects your mistakes gently',
      icon: '🗣️',
      formality: 'friendly'
    },
    {
      id: 'business_colleague',
      name: 'Business Colleague',
      description: 'A professional colleague for discussing work projects, industry trends, and career development',
      icon: '💼',
      formality: 'formal'
    },
    {
      id: 'cultural_guide',
      name: 'Cultural Guide',
      description: 'A knowledgeable local who shares traditions, customs, and helps you understand the culture',
      icon: '🏛️',
      formality: 'respectful'
    },
    {
      id: 'casual_friend',
      name: 'Casual Friend',
      description: 'A close friend for relaxed conversations about daily life, hobbies, and personal interests',
      icon: '😊',
      formality: 'intimate'
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Describe your own conversation partner or scenario',
      icon: '✍️',
      formality: 'friendly'
    }
  ];

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
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
    setError('');
  };

  const handleCustomTopicToggle = () => {
    setUseCustomTopic(!useCustomTopic);
    if (useCustomTopic) {
      setCustomTopic('');
    }
    setError('');
  };

  const handlePersonaSelect = (personaId: string) => {
    setSelectedPersona(personaId);
    const persona = DEFAULT_PERSONAS.find(p => p.id === personaId);
    if (persona && personaId !== 'custom') {
      setSelectedFormality(persona.formality);
      setConversationDescription(persona.description);
    } else if (personaId === 'custom') {
      setConversationDescription('');
    }
    setError('');
  };

  const handleStartConversation = async () => {
    if (!dashboardExists) {
      setError('No language dashboard found for this language. Please complete onboarding or add this language in your dashboard.');
      return;
    }
    const topics: string[] = [...selectedTopics];
    if (useCustomTopic && customTopic.trim()) {
      topics.push(customTopic.trim());
    }
    if (topics.length === 0) {
      setError('Please select at least one topic or enter a custom topic.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt');
      const dashboardLanguage = currentDashboard?.language || currentLanguage || 'en';
      // Check if using a saved persona
      const isUsingSavedPersona = selectedPersona && selectedPersona.startsWith('saved_');
      const savedPersonaId = isUsingSavedPersona ? selectedPersona.replace('saved_', '') : null;
      
      const response = await axios.post('/api/conversations', {
        language: dashboardLanguage,
        title: topics.length === 1 ? `${topics[0]} Discussion` : 'Multi-topic Discussion',
        topics: topics,
        formality: selectedFormality,
        description: conversationDescription,
        usesPersona: isUsingSavedPersona || selectedPersona !== 'custom',
        personaId: savedPersonaId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { conversation, aiMessage } = response.data;
      if (!conversation || !conversation.id) {
        setError('Failed to create conversation. Please check your language dashboard for this language.');
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
        onStartConversation(conversation.id, topics, aiMessage, selectedFormality, conversationDescription);
        onClose();
      } else {
        setError('Failed to verify new conversation. Please try again.');
      }
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      setError('Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .responsive-modal {
            padding: 1rem !important;
            border-radius: 10px !important;
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
          style={{
            position: 'relative',
            background: '#fff',
            borderRadius: 20,
            padding: '2rem',
            boxShadow: '0 20px 60px rgba(60,76,115,0.25)',
            width: 'auto',
            minWidth: 320,
            maxWidth: '90vw',
            height: 'auto',
            overflow: 'visible',
            boxSizing: 'border-box',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{
              color: '#3c4c73',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}>
              Start a Practice Session
            </h2>
            <p style={{
              color: '#7e5a75',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>
              Choose your topics, conversation style, and partner to begin practicing
            </p>
          </div>

          {/* Saved Personas Section */}
          {savedPersonas.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                color: '#3c4c73',
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '1rem',
                fontFamily: 'Montserrat, Arial, sans-serif',
                textAlign: 'center'
              }}>
                🎭 Your Saved Personas
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0.75rem',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '0.5rem'
              }}>
                {savedPersonas.map((persona) => (
                  <div
                    key={persona.id}
                    onClick={() => {
                      setSelectedPersona(`saved_${persona.id}`);
                      setSelectedFormality(persona.formality);
                      setConversationDescription(persona.description || '');
                      setSelectedTopics(persona.topics || []);
                      setError('');
                    }}
                    style={{
                      padding: '0.75rem',
                      border: '2px solid #e9ecef',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: selectedPersona === `saved_${persona.id}` ? 'rgba(126,90,117,0.1)' : '#fff',
                      borderColor: selectedPersona === `saved_${persona.id}` ? 'var(--rose-primary)' : '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ fontSize: '1.2rem' }}>🎭</div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: '#3c4c73',
                        marginBottom: '0.25rem'
                      }}>
                        {persona.name}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#6c757d',
                        lineHeight: 1.3
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
              padding: '0.75rem',
              borderRadius: 8,
              marginBottom: '1.5rem',
              border: '1px solid rgba(220,53,69,0.2)',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Dashboard missing warning */}
          {!dashboardExists && (
            <div style={{
              background: 'rgba(255, 215, 0, 0.15)',
              color: '#b8860b',
              padding: '1rem',
              borderRadius: 8,
              marginBottom: '1.5rem',
              border: '1px solid #ffe066',
              textAlign: 'center',
              fontWeight: 600
            }}>
              No language dashboard found for this language.<br />
              Please complete onboarding or add this language in your dashboard settings before starting a conversation.
            </div>
          )}

          {/* 1. Topic Selection Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              color: '#3c4c73', 
              fontSize: '1rem', 
              fontWeight: 600, 
              marginBottom: '0.5rem'
            }}>
              📚 Your Topics
            </h3>
            <p style={{ 
              color: '#7e5a75', 
              fontSize: '0.85rem', 
              marginBottom: '1rem',
              lineHeight: 1.4
            }}>
              Choose one or more topics to focus on in this practice session. You can add or remove topics in your profile settings.
            </p>
            {currentDashboard?.talk_topics && currentDashboard.talk_topics.length > 0 ? (
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                {currentDashboard.talk_topics.map((topicId: string) => {
                  const topic: Topic | undefined = TALK_TOPICS.find((t: Topic) => t.id === topicId);
                  if (!topic) return null;
                  const isSelected = selectedTopics.includes(topic.id);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => handleTopicSelect(topic.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '16px',
                        border: `2px solid ${isSelected ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                        backgroundColor: isSelected ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 500,
                        color: '#3c4c73',
                        fontSize: '0.95rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{topic.icon}</span> {topic.label}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '1.5rem',
                background: 'rgba(126,90,117,0.1)',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#7e5a75',
                fontSize: '0.9rem'
              }}>
                No topics available. Please add topics in your language dashboard settings.
              </div>
            )}
            {/* Custom Topic Toggle */}
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={handleCustomTopicToggle}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: `2px solid ${useCustomTopic ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                  backgroundColor: useCustomTopic ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 500,
                  color: '#3c4c73',
                  fontSize: '0.9rem'
                }}
              >
                <span>✍️</span> Add Custom Topic
              </button>
            </div>
            {/* Custom Topic Input */}
            {useCustomTopic && (
              <div style={{ marginTop: '1rem' }}>
                <input
                  type="text"
                  placeholder="Enter your custom topic..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(126,90,117,0.3)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    background: '#f8f6f4',
                    color: '#3c4c73'
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* 2. Formality Selection Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#3c4c73', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              🏷️ Conversation Formality
            </h3>
            <p style={{ color: '#7e5a75', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.4 }}>
              Choose the level of formality or closeness for this session. This affects the AI's tone, pronouns, and style.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.5rem'
            }}>
              {Object.entries(CLOSENESS_LEVELS).map(([key, desc]) => {
                const iconMatch = desc.match(/([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])/);
                const icon = iconMatch ? iconMatch[0] : '';
                const label = desc.split(':')[0];
                const detail = desc.split(':').slice(1).join(':').trim();
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedFormality(key)}
                    style={{
                      padding: '0.4rem 0.7rem',
                      borderRadius: '8px',
                      border: `2px solid ${selectedFormality === key ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                      backgroundColor: selectedFormality === key ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      minHeight: 36,
                      fontSize: '0.92rem',
                      boxShadow: selectedFormality === key ? '0 2px 8px rgba(126,90,117,0.12)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', marginTop: 2 }}>{icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#3c4c73', fontSize: '0.95rem', marginBottom: 2 }}>{label}</div>
                      <div style={{ color: '#7e5a75', fontSize: '0.8rem', opacity: 0.85 }}>{detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Conversation Partner Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              color: '#3c4c73', 
              fontSize: '1rem', 
              fontWeight: 600, 
              marginBottom: '0.5rem'
            }}>
              🎭 Conversation Partner
            </h3>
            <p style={{ 
              color: '#7e5a75', 
              fontSize: '0.85rem', 
              marginBottom: '1rem',
              lineHeight: 1.4
            }}>
              Choose who you'd like to talk to, or describe your own conversation partner
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.75rem'
            }}>
              {DEFAULT_PERSONAS.map((persona) => (
                <div
                  key={persona.id}
                  onClick={() => handlePersonaSelect(persona.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: `2px solid ${selectedPersona === persona.id ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                    backgroundColor: selectedPersona === persona.id ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    minHeight: 80,
                    boxShadow: selectedPersona === persona.id ? '0 4px 12px rgba(126,90,117,0.15)' : '0 2px 4px rgba(126,90,117,0.05)',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginTop: 2 }}>{persona.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 600, 
                      color: '#3c4c73', 
                      fontSize: '1rem', 
                      marginBottom: '0.25rem' 
                    }}>
                      {persona.name}
                    </div>
                    <div style={{ 
                      color: '#7e5a75', 
                      fontSize: '0.85rem', 
                      lineHeight: 1.4 
                    }}>
                      {persona.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Custom Description Input */}
            {selectedPersona === 'custom' && (
              <div style={{ marginTop: '1rem' }}>
                <textarea
                  placeholder="Describe your conversation partner or scenario (e.g., 'A friendly neighbor who loves gardening', 'A university professor discussing literature')"
                  value={conversationDescription}
                  onChange={(e) => setConversationDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(126,90,117,0.3)',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    background: '#f8f6f4',
                    color: '#3c4c73',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}
          </div>

          {/* Selected Tags Display (Topics → Formality → Persona) */}
          {(selectedTopics.length > 0 || (useCustomTopic && customTopic.trim()) || selectedFormality || selectedPersona) && (
            <div style={{
              background: 'rgba(126,90,117,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Topic tags */}
              {selectedTopics.map((topicId: string) => {
                const topic: Topic | undefined = TALK_TOPICS.find((t: Topic) => t.id === topicId);
                if (topic) {
                  // Standard topic from TALK_TOPICS
                  return (
                    <span key={topicId} style={{
                      background: '#7e5a75',
                      color: '#fff',
                      padding: '0.5rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 500
                    }}>
                      {topic.icon} {topic.label}
                    </span>
                  );
                } else {
                  // Custom topic (not in TALK_TOPICS)
                  return (
                    <span key={topicId} style={{
                      background: '#e67e22',
                      color: '#fff',
                      padding: '0.5rem 1rem',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 500
                    }}>
                      ✍️ {topicId}
                    </span>
                  );
                }
              })}
              {/* Custom topic tag */}
              {useCustomTopic && customTopic.trim() && (
                <span style={{
                  background: '#e67e22',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 500
                }}>
                  ✍️ {customTopic.trim()}
                </span>
              )}
              {/* Formality tag */}
              {selectedFormality && (
                <span style={{
                  background: '#3c4c73',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 500
                }}>
                  🏷️ {CLOSENESS_LEVELS[selectedFormality].split(':')[0]}
                </span>
              )}
              {/* Persona tag */}
              {selectedPersona && (
                <span style={{
                  background: '#e67e22',
                  color: '#fff',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 500
                }}>
                  🎭 {selectedPersona.startsWith('saved_') ? 'Saved Persona' : DEFAULT_PERSONAS.find(p => p.id === selectedPersona)?.name || 'Custom'}
                </span>
              )}
            </div>
          )}

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
            <button
              onClick={handleStartConversation}
              disabled={isLoading || (!selectedTopics.length && (!useCustomTopic || !customTopic.trim())) || !dashboardExists || !selectedPersona}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 10,
                border: 'none',
                background: isLoading || (!selectedTopics.length && (!useCustomTopic || !customTopic.trim())) || !dashboardExists || !selectedPersona ? '#ccc' : 
                           'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: isLoading || (!selectedTopics.length && (!useCustomTopic || !customTopic.trim())) || !dashboardExists || !selectedPersona ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: !isLoading && (selectedTopics.length > 0 || (useCustomTopic && customTopic.trim())) && dashboardExists && selectedPersona ? '0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15)' : 'none',
                animation: !isLoading && (selectedTopics.length > 0 || (useCustomTopic && customTopic.trim())) && dashboardExists && selectedPersona ? 'glowPulse 1.8s infinite alternate' : 'none',
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
        </div>
      </div>
    </>
  );
} 