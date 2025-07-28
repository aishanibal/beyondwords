"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TALK_TOPICS, Topic } from '../../lib/preferences';
import { useRouter } from 'next/navigation';

const CLOSENESS_LEVELS: { [key: string]: string } = {
  intimate: '👫 Intimate: Close friends, family, or partners',
  friendly: '😊 Friendly: Peers, classmates, or casual acquaintances',
  respectful: '🙏 Respectful: Teachers, elders, or professionals',
  formal: '🎩 Formal: Strangers, officials, or business contacts',
  distant: '🧑‍💼 Distant: Large groups, public speaking, or unknown audience',
};

interface TopicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartConversation: (id: string, topics: string[], aiMessage: any, formality: string) => void;
  currentLanguage?: string;
}

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function TopicSelectionModal({ isOpen, onClose, onStartConversation, currentLanguage }: TopicSelectionModalProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [useCustomTopic, setUseCustomTopic] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentDashboard, setCurrentDashboard] = useState<any>(null);
  const [selectedFormality, setSelectedFormality] = useState<string>('friendly');
  const [hasProgressed, setHasProgressed] = useState(false);
  const router = useRouter();

  const fetchLanguageDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`/api/user/language-dashboards/${currentLanguage}`, { headers: getAuthHeaders() });
      setCurrentDashboard(response.data.dashboard);
    } catch (err: any) {
      console.error('Error fetching language dashboard:', err);
      setError('Failed to load language settings');
    }
  }, [currentLanguage]);

  useEffect(() => {
    if (currentLanguage && isOpen) {
      fetchLanguageDashboard();
    }
  }, [currentLanguage, isOpen, fetchLanguageDashboard]);

  // When user selects a topic or enters a custom topic, set hasProgressed to true
  useEffect(() => {
    if ((selectedTopics.length > 0 || (useCustomTopic && customTopic.trim())) && !hasProgressed) {
      setHasProgressed(true);
    }
  }, [selectedTopics, useCustomTopic, customTopic, hasProgressed]);

  const dashboardExists = !!(currentDashboard && currentDashboard.language === currentLanguage);

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopics((prev: string[]) =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
    setError('');
  };

  const handleCustomTopicToggle = () => {
    setUseCustomTopic(!useCustomTopic);
    setSelectedTopics([]);
    setError('');
  };

  const handleStartConversation = async () => {
    if (!dashboardExists) {
      setError('No language dashboard found for this language. Please complete onboarding or add this language in your dashboard.');
      return;
    }
    let topics: string[] = [...selectedTopics];
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
      const response = await axios.post('/api/conversations', {
        language: dashboardLanguage,
        title: topics.length === 1 ? `${topics[0]} Discussion` : 'Multi-topic Discussion',
        topics: topics,
        formality: selectedFormality
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
        onStartConversation(conversation.id, topics, aiMessage, selectedFormality);
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
          {/* Return to Dashboard Button */}
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              position: 'absolute',
              top: 12,
              left: 16,
              fontSize: '0.95rem',
              background: 'none',
              border: 'none',
              color: '#7e5a75',
              cursor: 'pointer',
              opacity: 0.7,
              padding: 0,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '1.1em', marginRight: 4, textDecoration: 'none' }}>{'<'}</span>
            <span style={{ textDecoration: 'underline' }}>Return to Dashboard</span>
          </button>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <h2 style={{
              color: '#3c4c73',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              fontFamily: 'Grandstander, Arial, sans-serif'
            }}>
              Choose Your Topic
            </h2>
            <p style={{ color: '#7e5a75', fontSize: '0.9rem', margin: 0 }}>
              Select one topic to focus on in this practice session
            </p>
          </div>
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
          {/* Topic Selection Section (always visible) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              color: '#3c4c73', 
              fontSize: '1rem', 
              fontWeight: 600, 
              marginBottom: '0.5rem'
            }}>
              Your Topics
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
                border: '2px dashed rgba(126,90,117,0.3)'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📝</div>
                <div style={{ color: '#7e5a75', fontWeight: 600, marginBottom: '0.5rem' }}>
                  No topics selected yet
                </div>
                <div style={{ color: '#7e5a75', fontSize: '0.85rem' }}>
                  Visit your profile settings to add topics you&apos;d like to discuss.
                </div>
              </div>
            )}
          </div>
          {/* Custom Topic Section (always visible) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '0.75rem' 
            }}>
              <input
                type="checkbox"
                checked={useCustomTopic}
                onChange={() => setUseCustomTopic(!useCustomTopic)}
                style={{ transform: 'scale(1.2)' }}
              />
              <h3 style={{ 
                color: '#3c4c73', 
                fontSize: '1rem', 
                fontWeight: 600, 
                margin: 0
              }}>
                ✍️ Custom Topic
              </h3>
            </div>
            {useCustomTopic && (
              <div>
                <input
                  type="text"
                  placeholder="Enter your custom topic (e.g., 'My childhood memories', 'Planning a vacation')"
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
          {/* Progressive: Only show formality and start button if a topic is selected or hasProgressed is true */}
          {(selectedTopics.length > 0 || (useCustomTopic && customTopic.trim()) || hasProgressed) && (
            <>
              {/* Formality/Closeness Selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#3c4c73', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Conversation Formality
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
              {/* Selected Tags Display (Topics + Formality) */}
              {(selectedTopics.length > 0 || (useCustomTopic && customTopic.trim()) || selectedFormality) && (
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
                    if (!topic) return null;
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
                </div>
              )}
              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
                <button
                  onClick={handleStartConversation}
                  disabled={isLoading || (!selectedTopics.length && (!useCustomTopic || !customTopic.trim())) || !dashboardExists}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: 10,
                    border: 'none',
                    background: isLoading || (!selectedTopics.length && (!useCustomTopic || !customTopic.trim())) || !dashboardExists ? '#ccc' : 
                               'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: isLoading || (!selectedTopics.length && (!useCustomTopic || !customTopic.trim())) || !dashboardExists ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: !isLoading && (selectedTopics.length > 0 || (useCustomTopic && customTopic.trim())) && dashboardExists ? '0 0 16px 4px #eec1d1, 0 4px 16px rgba(60,76,115,0.15)' : 'none',
                    animation: !isLoading && (selectedTopics.length > 0 || (useCustomTopic && customTopic.trim())) && dashboardExists ? 'glowPulse 1.8s infinite alternate' : 'none',
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
            </>
          )}
        </div>
      </div>
    </>
  );
} 