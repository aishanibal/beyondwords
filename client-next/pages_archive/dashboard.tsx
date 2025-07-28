// FILE COMMENTED OUT DUE TO APP ROUTER MIGRATION
// TODO: This file should be split into Next.js pages and components.
import React, { useEffect, useState } from 'react';
import { useUser } from './_app';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Topic } from '../lib/preferences';
import LanguageOnboarding from './language-onboarding';

// Type definitions
interface DashboardType {
  language: string;
  proficiency_level: string;
  talk_topics: string[];
  learning_goals: string[];
  is_primary?: boolean;
}

interface ConversationType {
  id: string;
  title?: string;
  created_at: string;
  message_count?: number;
}

interface DashboardSettingsModalProps {
  dashboard: DashboardType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (dashboard: DashboardType) => void;
}

const TALK_TOPICS: Topic[] = [
  { id: 'family', label: 'Family and relationships', icon: '👨‍👩‍👧‍👦' },
  { id: 'travel', label: 'Travel experiences and cultures', icon: '✈️' },
  { id: 'heritage', label: 'Cultural heritage and traditions', icon: '🏛️' },
  { id: 'business', label: 'Work and professional life', icon: '💼' },
  { id: 'media', label: 'Movies, music, and media', icon: '🎬' },
  { id: 'food', label: 'Food and cooking', icon: '🍽️' },
  { id: 'hobbies', label: 'Hobbies and leisure activities', icon: '🎨' },
  { id: 'news', label: 'News and current events', icon: '📰' },
  { id: 'sports', label: 'Sports and fitness', icon: '⚽️' },
  { id: 'education', label: 'Education and learning', icon: '📚' },
  { id: 'technology', label: 'Technology and innovation', icon: '💻' },
  { id: 'health', label: 'Health and wellness', icon: '🏥' }
];

function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [languageDashboards, setLanguageDashboards] = useState<DashboardType[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showLanguageOnboarding, setShowLanguageOnboarding] = useState<boolean>(false);
  const [showDashboardSettings, setShowDashboardSettings] = useState<boolean>(false);

  useEffect(() => {
    console.log('DASHBOARD useEffect triggered. user:', user);
    async function fetchDashboardData() {
      setLoading(true);
      setError('');
      
      try {
        // Fetch language dashboards
        const token = localStorage.getItem('jwt');
        const dashboardsRes = await axios.get('/api/user/language-dashboards', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dashboards: DashboardType[] = dashboardsRes.data.dashboards || [];
        
        // Ensure arrays are properly initialized
        const processedDashboards: DashboardType[] = dashboards.map((dashboard: DashboardType) => ({
          ...dashboard,
          talk_topics: dashboard.talk_topics || [],
          learning_goals: dashboard.learning_goals || []
        }));
        
        setLanguageDashboards(processedDashboards);
        
        // Set default selected language to primary dashboard
        const primaryDashboard = processedDashboards.find((d: DashboardType) => d.is_primary);
        let currentLanguage = selectedLanguage;
        console.log('🔍 FRONTEND: Primary dashboard:', primaryDashboard);
        console.log('🔍 FRONTEND: Current selectedLanguage:', selectedLanguage);
        if (primaryDashboard && !selectedLanguage) {
          currentLanguage = primaryDashboard.language;
          console.log('🔄 FRONTEND: Setting selectedLanguage to:', currentLanguage);
          setSelectedLanguage(currentLanguage);
        }
        
        // Conversations will be fetched by the separate useEffect when selectedLanguage changes
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  // Separate effect to fetch conversations when selectedLanguage changes
  useEffect(() => {
    async function fetchConversations() {
      if (selectedLanguage && user?.id) {
        try {
          console.log('🔍 FRONTEND: Fetching conversations for language:', selectedLanguage);
          
          // Clear conversations first to avoid showing old data
          setConversations([]);
          
          const token = localStorage.getItem('jwt');
          const conversationsRes = await axios.get(`/api/conversations?language=${selectedLanguage}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('📥 FRONTEND: Received conversations:', conversationsRes.data.conversations);
          setConversations(conversationsRes.data.conversations || []);
        } catch (err) {
          console.error('Error fetching conversations:', err);
          setConversations([]); // Clear on error too
        }
      }
    }
    
    fetchConversations();
  }, [selectedLanguage, user?.id]);

  // Helper functions
  const getLanguageInfo = (code: string): { label: string; flag: string } => {
    const languages: Record<string, { label: string; flag: string }> = {
      'es': { label: 'Spanish', flag: '🇪🇸' },
      'hi': { label: 'Hindi', flag: '🇮🇳' },
      'ja': { label: 'Japanese', flag: '🇯🇵' },
      'tl': { label: 'Tagalog', flag: '🇵🇭' },
      'ta': { label: 'Tamil', flag: '🇮🇳' },
      'ar': { label: 'Arabic', flag: '🇸🇦' },
      'zh': { label: 'Mandarin', flag: '🇨🇳' },
      'ko': { label: 'Korean', flag: '🇰🇷' }
    };
    return languages[code] || { label: code, flag: '🌍' };
  };

  const getProficiencyDisplay = (level: string): { label: string; icon: string } => {
    const levels: Record<string, { label: string; icon: string }> = {
      'beginner': { label: 'Beginner', icon: '🌱' },
      'elementary': { label: 'Elementary', icon: '🌿' },
      'intermediate': { label: 'Intermediate', icon: '🌳' },
      'advanced': { label: 'Advanced', icon: '🏔️' },
      'fluent': { label: 'Fluent', icon: '🗝️' }
    };
    return levels[level] || { label: level, icon: '🌱' };
  };

  const deleteConversation = async (conversationId: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/conversations/${conversationId}`);
      setConversations((prev: ConversationType[]) => prev.filter((conv: ConversationType) => conv.id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const handleLanguageOnboardingComplete = (newDashboard: DashboardType) => {
    console.log('🔍 FRONTEND: New dashboard from onboarding:', newDashboard);
    
    // Ensure arrays are properly initialized for the new dashboard
    const processedDashboard: DashboardType = {
      ...newDashboard,
      talk_topics: newDashboard.talk_topics || [],
      learning_goals: newDashboard.learning_goals || []
    };
    
    console.log('🔄 FRONTEND: Processed dashboard:', processedDashboard);
    
    setLanguageDashboards((prev: DashboardType[]) => [...prev, processedDashboard]);
    setShowLanguageOnboarding(false);
    setSelectedLanguage(newDashboard.language);
    // Optionally, navigate to dashboard or another page if needed
    // router.push('/dashboard');
  };

  // Get current dashboard and ensure arrays are initialized
  const currentDashboard = languageDashboards.find((d: DashboardType) => d.language === selectedLanguage);
  if (currentDashboard) {
    currentDashboard.talk_topics = currentDashboard.talk_topics || [];
    currentDashboard.learning_goals = currentDashboard.learning_goals || [];
  }
  
  // Calculate usage stats
  const [streak, setStreak] = useState<number>(0);
  // Optionally: const [usageByDay, setUsageByDay] = useState([]);

  useEffect(() => {
    async function fetchStreak() {
      if (user?.id && selectedLanguage) {
        try {
          const res = await axios.get(`/api/user/streak?userId=${user.id}&language=${selectedLanguage}`);
          setStreak(res.data.streak || 0);
          // Optionally: setUsageByDay(res.data.days || []);
        } catch (err) {
          setStreak(0);
        }
      }
    }
    fetchStreak();
  }, [user?.id, selectedLanguage]);

  // Dashboard Settings Modal Component
  const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({ dashboard, isOpen, onClose, onUpdate }) => {
    const [editedDashboard, setEditedDashboard] = useState<DashboardType>(dashboard);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>('');

    useEffect(() => {
      if (dashboard) {
        setEditedDashboard({
          ...dashboard,
          talk_topics: dashboard.talk_topics || [],
          learning_goals: dashboard.learning_goals || []
        });
      }
    }, [dashboard]);

    const handleTopicToggle = (topicId: string) => {
      setEditedDashboard((prev: DashboardType) => ({
        ...prev,
        talk_topics: prev.talk_topics.includes(topicId)
          ? prev.talk_topics.filter((id: string) => id !== topicId)
          : [...prev.talk_topics, topicId]
      }));
    };

    const handleSave = async () => {
      setIsSaving(true);
      setSaveError('');
      
      try {
        const response = await axios.put(`/api/user/language-dashboards/${dashboard.language}`, {
          proficiency_level: editedDashboard.proficiency_level,
          talk_topics: editedDashboard.talk_topics,
          learning_goals: editedDashboard.learning_goals
        });
        
        onUpdate(response.data.dashboard);
        onClose();
      } catch (err: any) {
        console.error('Error updating dashboard:', err);
        setSaveError('Failed to update dashboard settings. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };

    const handleDelete = async () => {
      const confirmMessage = `Are you sure you want to delete your ${getLanguageInfo(dashboard.language).label} dashboard? This will permanently delete all conversations and messages in this language. This action cannot be undone.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
      
      setIsDeleting(true);
      setSaveError('');
      
      try {
        await axios.delete(`/api/user/language-dashboards/${dashboard.language}`);
        
        // Remove the dashboard from the state
        setLanguageDashboards((prev: DashboardType[]) => prev.filter((d: DashboardType) => d.language !== dashboard.language));
        
        // If this was the selected language, switch to another one
        if (selectedLanguage === dashboard.language) {
          const remainingDashboards = languageDashboards.filter((d: DashboardType) => d.language !== dashboard.language);
          const newSelectedLanguage = remainingDashboards.find((d: DashboardType) => d.is_primary)?.language || remainingDashboards[0]?.language;
          setSelectedLanguage(newSelectedLanguage);
        }
        
        onClose();
      } catch (err: any) {
        console.error('Error deleting dashboard:', err);
        if (err.response?.data?.error) {
          setSaveError(err.response.data.error);
        } else {
          setSaveError('Failed to delete dashboard. Please try again.');
        }
      } finally {
        setIsDeleting(false);
      }
    };

    if (!isOpen) return null;

    return (
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
        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(60,76,115,0.25)',
          maxWidth: 'min(600px, 90vw)',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️</div>
            <h2 style={{
              color: '#3c4c73',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              fontFamily: 'Grandstander, Arial, sans-serif'
            }}>
              Dashboard Settings
            </h2>
            <p style={{ color: '#7e5a75', fontSize: '0.9rem', margin: 0 }}>
              Customize your {getLanguageInfo(dashboard.language).label} learning experience
            </p>
          </div>

          {saveError && (
            <div style={{
              background: 'rgba(220,53,69,0.1)',
              color: '#dc3545',
              padding: '0.75rem',
              borderRadius: 8,
              marginBottom: '1.5rem',
              border: '1px solid rgba(220,53,69,0.2)',
              textAlign: 'center'
            }}>
              {saveError}
            </div>
          )}

          {/* Proficiency Level */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              color: '#3c4c73', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              marginBottom: '1rem'
            }}>
              📊 Proficiency Level
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '0.5rem'
            }}>
              {['beginner', 'elementary', 'intermediate', 'advanced', 'fluent'].map(level => {
                const isSelected = editedDashboard.proficiency_level === level;
                const profInfo = getProficiencyDisplay(level);
                
                return (
                  <button
                    key={level}
                    onClick={() => setEditedDashboard((prev: DashboardType) => ({ ...prev, proficiency_level: level }))}
                    style={{
                      background: isSelected ? '#7e5a75' : 'rgba(126,90,117,0.1)',
                      color: isSelected ? '#fff' : '#3c4c73',
                      border: `2px solid ${isSelected ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                      borderRadius: 8,
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>{profInfo.icon}</span>
                    {profInfo.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topics */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              color: '#3c4c73', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              marginBottom: '1rem'
            }}>
              💬 Conversation Topics
            </h3>
            <p style={{ 
              color: '#7e5a75', 
              fontSize: '0.85rem', 
              marginBottom: '1rem',
              lineHeight: 1.4
            }}>
              Choose topics you'd like to practice. You can select multiple topics.
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '0.5rem'
            }}>
              {TALK_TOPICS.map(topic => {
                const isSelected = editedDashboard.talk_topics.includes(topic.id);
                
                return (
                  <div
                    key={topic.id}
                    onClick={() => handleTopicToggle(topic.id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: `2px solid ${isSelected ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                      backgroundColor: isSelected ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ fontSize: '1.2rem' }}>{topic.icon}</div>
                    <div style={{ 
                      fontWeight: 500, 
                      color: '#3c4c73', 
                      fontSize: '0.85rem',
                      flex: 1
                    }}>
                      {topic.label}
                    </div>
                    {isSelected && (
                      <div style={{ color: '#7e5a75', fontSize: '1rem' }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delete Warning */}
          <div style={{
            background: 'rgba(220,53,69,0.1)',
            border: '1px solid rgba(220,53,69,0.2)',
            borderRadius: 8,
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div style={{ color: '#dc3545', fontWeight: 600, fontSize: '0.9rem' }}>
                Danger Zone
              </div>
            </div>
            <p style={{ 
              color: '#dc3545', 
              fontSize: '0.85rem', 
              margin: 0,
              lineHeight: 1.4
            }}>
              Deleting this dashboard will permanently remove all conversations, messages, and settings for {getLanguageInfo(dashboard.language).label}. This action cannot be undone.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.2rem',
                  borderRadius: 10,
                  border: '2px solid rgba(126,90,117,0.3)',
                  background: 'transparent',
                  color: '#7e5a75',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                style={{
                  padding: '0.75rem 1.2rem',
                  borderRadius: 10,
                  border: '2px solid #dc3545',
                  background: 'transparent',
                  color: '#dc3545',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: (isDeleting || isSaving) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: (isDeleting || isSaving) ? 0.5 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete'}
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              style={{
                padding: '0.75rem 1.2rem',
                borderRadius: 10,
                border: 'none',
                background: (isSaving || isDeleting) ? '#ccc' : 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: (isSaving || isDeleting) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {isSaving ? '💾 Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle dashboard update
  const handleDashboardUpdate = (updatedDashboard: DashboardType) => {
    setLanguageDashboards((prev: DashboardType[]) => 
      prev.map((dashboard: DashboardType) => 
        dashboard.language === updatedDashboard.language 
          ? { ...dashboard, ...updatedDashboard }
          : dashboard
      )
    );
  };

  if (showLanguageOnboarding) {
    return (
      <LanguageOnboarding
        onComplete={handleLanguageOnboardingComplete}
        existingLanguages={(languageDashboards || []).map((d: DashboardType) => d.language) as string[]}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(60,76,115,0.12)', padding: '2.5rem 2rem', marginBottom: '2rem' }}>
          <h1 style={{ color: '#3c4c73', fontFamily: 'Grandstander, Arial, sans-serif', fontWeight: 700, fontSize: '2rem', marginBottom: '1rem' }}>
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p style={{ color: '#7e5a75', fontSize: '1rem', marginBottom: '2rem' }}>
            Your multilingual journey dashboard
          </p>
          
          {/* Language Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#3c4c73', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
              📚 Your Language Dashboards
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              {(languageDashboards || []).map((dashboard: DashboardType) => {
                const langInfo = getLanguageInfo(dashboard.language);
                const profInfo = getProficiencyDisplay(dashboard.proficiency_level);
                const isSelected = selectedLanguage === dashboard.language;
                
                return (
                  <button
                    key={dashboard.language}
                    onClick={() => setSelectedLanguage(dashboard.language)}
                    style={{
                      background: isSelected ? 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)' : '#f8f6f4',
                      color: isSelected ? '#fff' : '#3c4c73',
                      border: `2px solid ${isSelected ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                      borderRadius: 12,
                      padding: '1rem 1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{langInfo.flag}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div>{langInfo.label}</div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        opacity: 0.8, 
                        color: isSelected ? '#f8f6f4' : '#7e5a75' 
                      }}>
                        {profInfo.icon} {profInfo.label}
                      </div>
                    </div>
                    {dashboard.is_primary && (
                      <span style={{ 
                        background: isSelected ? 'rgba(248,246,244,0.3)' : 'rgba(126,90,117,0.1)',
                        color: isSelected ? '#f8f6f4' : '#7e5a75',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}>
                        PRIMARY
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* Add Language Button */}
              <button
                onClick={() => setShowLanguageOnboarding(true)}
                style={{
                  background: 'transparent',
                  color: '#7e5a75',
                  border: '2px dashed rgba(126,90,117,0.4)',
                  borderRadius: 12,
                  padding: '1rem 1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>➕</span>
                Add Language
              </button>
            </div>
          </div>
        </div>

        {/* Current Language Dashboard */}
        {currentDashboard && currentDashboard.language && (
          <>
            {/* Dashboard Header */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2rem' }}>{getLanguageInfo(currentDashboard.language).flag}</span>
                    <h2 style={{ color: '#3c4c73', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                      {getLanguageInfo(currentDashboard.language).label}
                    </h2>
                    <span style={{ 
                      background: '#7e5a75', 
                      color: '#fff', 
                      padding: '0.3rem 0.75rem', 
                      borderRadius: 6, 
                      fontSize: '0.8rem', 
                      fontWeight: 600 
                    }}>
                      {getProficiencyDisplay(currentDashboard.proficiency_level).label}
                    </span>
                  </div>
                  <div style={{ color: '#7e5a75', fontSize: '0.9rem' }}>
                    {(currentDashboard.talk_topics?.length || 0)} topics • {(currentDashboard.learning_goals?.length || 0)} goals
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setShowDashboardSettings(true)}
                    style={{
                      background: 'transparent',
                      color: '#7e5a75',
                      border: '2px solid rgba(126,90,117,0.3)',
                      borderRadius: 8,
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    ⚙️ Settings
                  </button>
                  <Link 
                    href={`/analyze?language=${currentDashboard.language}`}
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                      color: '#fff',
                      padding: '0.75rem 1.5rem',
                      borderRadius: 10,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(126,90,117,0.3)'
                    }}
                  >
                    🎤 Practice Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔥</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c38d94', marginBottom: '0.25rem' }}>{streak}</div>
                <div style={{ color: '#7e5a75', fontSize: '0.8rem' }}>Day Streak</div>
              </div>
              
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7e5a75', marginBottom: '0.25rem' }}>{(conversations || []).length}</div>
                <div style={{ color: '#7e5a75', fontSize: '0.8rem' }}>Conversations</div>
              </div>
              
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3c4c73', marginBottom: '0.25rem' }}>{currentDashboard.learning_goals?.length || 0}</div>
                <div style={{ color: '#7e5a75', fontSize: '0.8rem' }}>Active Goals</div>
              </div>
            </div>

            {/* Recent Conversations */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '2rem' }}>
              <h3 style={{ color: '#3c4c73', fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>
                Recent Conversations
              </h3>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#7e5a75' }}>Loading conversations...</div>
              ) : error ? (
                <div style={{ color: '#dc3545', textAlign: 'center', padding: '2rem' }}>{error}</div>
              ) : (conversations || []).length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#7e5a75', 
                  background: 'rgba(126,90,117,0.05)', 
                  borderRadius: 12, 
                  border: '2px dashed rgba(126,90,117,0.2)' 
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎤</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Start your first conversation!</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    Click &quot;Practice Now&quot; to begin learning {getLanguageInfo(currentDashboard.language).label}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(conversations || []).slice(0, 5).map((conversation: ConversationType) => (
                    <div key={conversation.id} style={{ 
                      background: 'rgba(126,90,117,0.05)', 
                      borderRadius: 12, 
                      padding: '1rem', 
                      border: '1px solid rgba(126,90,117,0.1)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontWeight: 600, color: '#3c4c73' }}>
                            {conversation.title || 'Untitled Conversation'}
                          </div>
                          <div style={{ color: '#7e5a75', fontSize: '0.8rem' }}>
                            {new Date(conversation.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Link 
                            href={`/analyze?conversation=${conversation.id}&language=${currentDashboard.language}`}
                            style={{ 
                              color: '#7e5a75', 
                              fontWeight: 600, 
                              textDecoration: 'none', 
                              fontSize: '0.9rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: 6,
                              background: 'rgba(126,90,117,0.1)',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            Continue →
                          </Link>
                          <button
                            onClick={() => deleteConversation(conversation.id)}
                            style={{
                              color: '#dc3545',
                              background: 'rgba(220,53,69,0.1)',
                              border: 'none',
                              borderRadius: 6,
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            title="Delete conversation"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div style={{ color: '#7e5a75', fontSize: '0.9rem', opacity: 0.8 }}>
                        💬 {conversation.message_count || 0} messages
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Dashboard Settings Modal */}
      {currentDashboard && (
        <DashboardSettingsModal
          dashboard={currentDashboard}
          isOpen={showDashboardSettings}
          onClose={() => setShowDashboardSettings(false)}
          onUpdate={handleDashboardUpdate}
        />
      )}
    </div>
  );
}

export default Dashboard; 