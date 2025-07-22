import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../pages/_app';
import axios from 'axios';

interface Topic {
  id: string;
  label: string;
  icon: string;
}
const TALK_TOPICS: Topic[] = [
  { id: 'family',    label: 'Family and relationships',            icon: '👨‍👩‍👧‍👦' },
  { id: 'travel',    label: 'Travel experiences and cultures',      icon: '✈️' },
  { id: 'heritage',  label: 'Cultural heritage and traditions',     icon: '🏛️' },
  { id: 'business',  label: 'Work and professional life',           icon: '💼' },
  { id: 'media',     label: 'Movies, music, and media',             icon: '🎬' },
  { id: 'food',      label: 'Food and cooking',                     icon: '🍽️' },
  { id: 'hobbies',   label: 'Hobbies and leisure activities',       icon: '🎨' },
  { id: 'news',      label: 'News and current events',              icon: '📰' },
  { id: 'sports',    label: 'Sports and fitness',                   icon: '⚽️' },
  { id: 'education', label: 'Education and learning',               icon: '📚' },
  { id: 'technology', label: 'Technology and innovation',           icon: '💻' },
  { id: 'health',    label: 'Health and wellness',                  icon: '🏥' }
];

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000', 
  withCredentials: false 
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function TopicSelection() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [userSavedTopics, setUserSavedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user?.talk_topics) {
      setUserSavedTopics(user.talk_topics);
      setSelectedTopics(user.talk_topics.slice(0, 3)); // Pre-select first 3 saved topics
    }
  }, [user]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev: string[]) => 
      prev.includes(topicId)
        ? prev.filter((id: string) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const startConversation = async () => {
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic to discuss.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('jwt');
      // Create conversation with selected topics
      const response = await API.post('/api/conversations', {
        language: user?.target_language || 'en',
        title: `${selectedTopics.map(id => TALK_TOPICS.find(t => t.id === id)?.label).join(', ')} Discussion`,
        topics: selectedTopics
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const conversationId = response.data.conversation.id;
      // Navigate to analyze page with conversation ID and selected topics
      const topicsParam = selectedTopics.join(',');
      router.push(`/analyze?conversation=${conversationId}&topics=${topicsParam}`);
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to start conversation. Please try again.');
      setIsLoading(false);
    }
  };

  const getTopicById = (id: string) => TALK_TOPICS.find((topic: Topic) => topic.id === id);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '3rem',
        boxShadow: '0 20px 60px rgba(60,76,115,0.15)',
        maxWidth: 700,
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
          <h1 style={{
            color: '#3c4c73',
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            fontFamily: 'Grandstander, Arial, sans-serif'
          }}>
            Choose Your Topics
          </h1>
          <p style={{ color: '#7e5a75', fontSize: '1rem' }}>
            Select topics you'd like to discuss in this practice session
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

        {/* Your Saved Topics */}
        {userSavedTopics.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              color: '#3c4c73', 
              fontSize: '1.2rem', 
              fontWeight: 600, 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ⭐ Your Favorite Topics
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              {userSavedTopics.map(topicId => {
                const topic = getTopicById(topicId);
                if (!topic) return null;
                return (
                  <div
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: `2px solid ${selectedTopics.includes(topic.id) ? '#7e5a75' : 'rgba(126,90,117,0.3)'}`,
                      backgroundColor: selectedTopics.includes(topic.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ fontSize: '1.1rem' }}>{topic.icon}</div>
                    <div style={{ fontWeight: 500, color: '#3c4c73', fontSize: '0.9rem' }}>{topic.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Available Topics */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            color: '#3c4c73', 
            fontSize: '1.2rem', 
            fontWeight: 600, 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🌟 All Topics
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '0.75rem'
          }}>
            {TALK_TOPICS.map(topic => (
              <div
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: `2px solid ${selectedTopics.includes(topic.id) ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                  backgroundColor: selectedTopics.includes(topic.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: userSavedTopics.includes(topic.id) ? 0.6 : 1
                }}
              >
                <div style={{ fontSize: '1.1rem' }}>{topic.icon}</div>
                <div style={{ fontWeight: 500, color: '#3c4c73', fontSize: '0.9rem' }}>{topic.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Topics Summary */}
        {selectedTopics.length > 0 && (
          <div style={{
            background: 'rgba(126,90,117,0.1)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#3c4c73', marginBottom: '0.5rem', fontSize: '1rem' }}>
              Selected Topics ({selectedTopics.length}):
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedTopics.map(topicId => {
                const topic = getTopicById(topicId);
                return (
                  <span key={topicId} style={{
                    background: '#7e5a75',
                    color: '#fff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {topic?.icon} {topic?.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 10,
              border: '2px solid rgba(126,90,117,0.3)',
              background: 'transparent',
              color: '#7e5a75',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ← Back to Dashboard
          </button>

          <button
            onClick={startConversation}
            disabled={isLoading || selectedTopics.length === 0}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 10,
              border: 'none',
              background: isLoading || selectedTopics.length === 0 ? '#ccc' : 
                         'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isLoading || selectedTopics.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? '🔄 Starting...' : '🎤 Start Practice Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopicSelection;