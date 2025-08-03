/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '../ClientLayout';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import LanguageOnboarding from '../components/LanguageOnboarding';
import DashboardSettingsModal from '../components/DashboardSettingsModal';

import { LEARNING_GOALS, LearningGoal, getProgressiveSubgoalDescription, getSubgoalLevel, getSubgoalProgress, updateSubgoalProgress, SubgoalProgress, LevelUpEvent } from '../../lib/preferences';

// Type definitions
interface DashboardType {
  language: string;
  proficiency_level: string;
  talk_topics: string[];
  learning_goals: string[];
  speak_speed?: number;
  romanization_display?: string; // 'both', 'script_only', 'romanized_only'
}

interface ConversationType {
  id: string;
  title?: string;
  created_at: string;
  message_count?: number;
  uses_persona?: boolean;
  persona_id?: number;
  persona_name?: string;
  persona_description?: string;
  synopsis?: string;
  progress_data?: string | { goals: string[]; percentages: number[] };
  learning_goals?: string[];
}

interface PersonaType {
  id: number;
  name: string;
  description: string;
  topics: string[];
  formality: string;
  language: string;
  conversation_id: string;
  created_at: string;
}

// Learning Goal Card Component
interface LearningGoalCardProps {
  goal: LearningGoal;
  index: number;
  progressData?: number[];
  userSubgoalProgress?: SubgoalProgress[];
}

function LearningGoalCard({ goal, index, progressData, userSubgoalProgress }: LearningGoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  console.log('LearningGoalCard received progressData:', progressData);
  console.log('LearningGoalCard goal:', goal);
  console.log('LearningGoalCard index:', index);

  return (
    <div style={{ 
      background: 'rgba(126,90,117,0.05)', 
      borderRadius: 12, 
      border: '1px solid rgba(126,90,117,0.1)',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* Goal Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: '0.75rem', 
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(126,90,117,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ 
          background: 'var(--rose-primary)', 
          color: '#fff', 
          borderRadius: '50%', 
          width: '24px', 
          height: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '0.8rem',
          fontWeight: 600,
          flexShrink: 0,
          fontFamily: 'Montserrat, Arial, sans-serif'
        }}>
          {index + 1}
        </div>
        <div style={{ 
          fontSize: '1.2rem',
          marginRight: '0.5rem'
        }}>
          {goal.icon}
        </div>
        <div style={{ 
          color: 'var(--foreground)', 
          fontWeight: 600,
          fontSize: '0.9rem',
          lineHeight: '1.3',
          fontFamily: 'Gabriela, Arial, sans-serif',
          flex: 1
        }}>
          {goal.goal}
        </div>
        <div style={{ 
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          fontSize: '1rem',
          color: 'var(--rose-primary)',
          fontWeight: 600
        }}>
          ▼
        </div>
      </div>

      {/* Subgoals Dropdown */}
      {isExpanded && (
        <div style={{ 
          background: 'rgba(126,90,117,0.02)',
          borderTop: '1px solid rgba(126,90,117,0.1)',
          padding: '0.75rem',
          opacity: 1,
          maxHeight: '500px',
          transition: 'all 0.3s ease-out'
        }}>
          <div style={{ 
            color: 'var(--rose-primary)', 
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            fontFamily: 'Montserrat, Arial, sans-serif'
          }}>
            Progress Indicators:
          </div>
          {goal.subgoals && goal.subgoals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {goal.subgoals.map((subgoal, subIndex) => {
                const userLevel = getSubgoalLevel(subgoal.id, userSubgoalProgress || []);
                const userProgress = getSubgoalProgress(subgoal.id, userSubgoalProgress || []);
                const currentDescription = getProgressiveSubgoalDescription(subgoal.id, userLevel);
                const displayProgress = userProgress;
                
                // Debug logging
                console.log(`Subgoal ${subgoal.id}:`, {
                  userLevel,
                  userProgress,
                  currentDescription,
                  userSubgoalProgress: userSubgoalProgress || []
                });
                
                return (
                  <div key={subgoal.id} style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    background: 'var(--card)',
                    borderRadius: 8,
                    border: '1px solid rgba(126,90,117,0.1)'
                  }}>
                    <div style={{ 
                      background: 'var(--rose-accent)', 
                      color: '#fff', 
                      borderRadius: '50%', 
                      width: '16px', 
                      height: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      flexShrink: 0,
                      fontFamily: 'Montserrat, Arial, sans-serif',
                      marginTop: '0.1rem'
                    }}>
                      {subIndex + 1}
                    </div>
                    <div style={{ 
                      color: 'var(--foreground)', 
                      fontSize: '0.75rem',
                      lineHeight: '1.4',
                      fontFamily: 'AR One Sans, Arial, sans-serif',
                      flex: 1
                    }}>
                      {currentDescription}
                      {userLevel > 0 && (
                        <div style={{
                          color: 'var(--rose-accent)',
                          fontSize: '0.65rem',
                          fontStyle: 'italic',
                          marginTop: '0.25rem'
                        }}>
                          Level {userLevel + 1}
                        </div>
                      )}
                    </div>
                    {/* Progress bar with actual data */}
                    <div style={{ 
                      width: '60px',
                      height: '6px',
                      background: 'rgba(126,90,117,0.1)',
                      borderRadius: 3,
                      marginTop: '0.2rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${displayProgress}%`,
                        height: '100%',
                        background: displayProgress >= 80 ? '#10b981' : 
                                  displayProgress >= 60 ? '#f59e0b' : 'var(--rose-primary)',
                        borderRadius: 3,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    {/* Percentage display */}
                    <div style={{ 
                      color: 'var(--foreground)', 
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      fontFamily: 'Montserrat, Arial, sans-serif',
                      marginLeft: '0.5rem',
                      minWidth: '30px',
                      textAlign: 'right'
                    }}>
                      {displayProgress}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              color: 'var(--rose-primary)', 
              fontSize: '0.75rem',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '1rem',
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>
              No progress indicators available for this goal yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}





export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [languageDashboards, setLanguageDashboards] = useState<DashboardType[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [personas, setPersonas] = useState<PersonaType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showLanguageOnboarding, setShowLanguageOnboarding] = useState<boolean>(false);
  const [showDashboardSettings, setShowDashboardSettings] = useState<boolean>(false);
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());

  // Persist selected language to localStorage whenever it changes
  React.useEffect(() => {
    if (selectedLanguage) {
      localStorage.setItem('selectedLanguage', selectedLanguage);
    }
  }, [selectedLanguage]);



  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt');
      const dashboardsRes = await axios.get('/api/user/language-dashboards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dashboards: DashboardType[] = dashboardsRes.data.dashboards || [];
      const processedDashboards: DashboardType[] = dashboards.map((dashboard: DashboardType) => ({
        ...dashboard,
        talk_topics: dashboard.talk_topics || [],
        learning_goals: dashboard.learning_goals || [],
        speak_speed: dashboard.speak_speed || 1.0,
        romanization_display: dashboard.romanization_display || 'both'
      }));
      setLanguageDashboards(processedDashboards);
      
      // Get saved language from localStorage
      const savedLanguage = localStorage.getItem('selectedLanguage');
      
      // Determine which language to select
      let languageToSelect = selectedLanguage;
      
      if (!languageToSelect) {
        // If no language is currently selected, check localStorage first
        if (savedLanguage && processedDashboards.some(d => d.language === savedLanguage)) {
          // Use saved language if it exists in available dashboards
          languageToSelect = savedLanguage;
        } else if (processedDashboards.length > 0) {
          // Fallback to first dashboard if no saved language or saved language not available
          languageToSelect = processedDashboards[0].language;
        }
      }
      
      // Only update if we have a language to select and it's different from current
      if (languageToSelect && languageToSelect !== selectedLanguage) {
        setSelectedLanguage(languageToSelect);
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedLanguage]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user, selectedLanguage, fetchDashboardData]);

  // Add effect to refresh dashboard when localStorage changes (for level-ups)
  useEffect(() => {
    const handleStorageChange = () => {
      if (user && selectedLanguage) {
        console.log('Storage changed, refreshing dashboard...');
        fetchDashboardData();
      }
    };

    // Listen for custom events for same-origin localStorage changes
    window.addEventListener('subgoalProgressUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('subgoalProgressUpdated', handleStorageChange);
    };
  }, [user, selectedLanguage, fetchDashboardData]);

  const fetchConversations = useCallback(async () => {
    if (selectedLanguage && user?.id) {
      try {
        setConversations([]);
        const token = localStorage.getItem('jwt');
        const conversationsRes = await axios.get(`/api/conversations?language=${selectedLanguage}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const conversations = conversationsRes.data.conversations || [];
        
        // Sort conversations by created_at date (newest first)
        const sortedConversations = conversations.sort((a: ConversationType, b: ConversationType) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        console.log('Fetched conversations with data:', sortedConversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          synopsis: conv.synopsis ? conv.synopsis.substring(0, 100) + '...' : 'No synopsis',
          progress_data: conv.progress_data,
          created_at: conv.created_at
        })));
        
        setConversations(sortedConversations);
      } catch (err) {
        setConversations([]);
      }
    }
  }, [selectedLanguage, user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Refetch conversations when user returns to dashboard (e.g., after completing a conversation)
  useEffect(() => {
    const handleFocus = () => {
      if (selectedLanguage && user?.id) {
        console.log('Dashboard focused, refetching conversations...');
        fetchConversations();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedLanguage, user?.id, fetchConversations]);

  useEffect(() => {
    async function fetchPersonas() {
      if (user?.id) {
        try {
          const token = localStorage.getItem('jwt');
          const personasRes = await axios.get(`/api/personas?userId=${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPersonas(personasRes.data.personas || []);
        } catch (err) {
          setPersonas([]);
        }
      }
    }
    fetchPersonas();
  }, [user?.id]);



  const deleteConversation = async (conversationId: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }
    try {
      await axios.delete(`/api/conversations/${conversationId}`);
      setConversations((prev: ConversationType[]) => prev.filter((conv: ConversationType) => conv.id !== conversationId));
    } catch (error) {
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const deletePersona = async (personaId: number) => {
    if (!window.confirm('Are you sure you want to delete this persona? This action cannot be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('jwt');
      await axios.delete(`/api/personas/${personaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPersonas((prev: PersonaType[]) => prev.filter((persona: PersonaType) => persona.id !== personaId));
    } catch (error) {
      alert('Failed to delete persona. Please try again.');
    }
  };

  const usePersona = (persona: PersonaType) => {
    // Store persona data in localStorage for the analyze page to use
    localStorage.setItem('selectedPersona', JSON.stringify({
      name: persona.name,
      description: persona.description,
      topics: persona.topics,
      formality: persona.formality,
      language: persona.language
    }));
    
    // Navigate to analyze page with persona data
    router.push(`/analyze?language=${persona.language}&topics=${persona.topics.join(',')}&formality=${persona.formality}&usePersona=true`);
  };

  const handleLanguageOnboardingComplete = (newDashboard: DashboardType) => {
    const processedDashboard: DashboardType = {
      ...newDashboard,
      talk_topics: newDashboard.talk_topics || [],
      learning_goals: newDashboard.learning_goals || [],
      speak_speed: newDashboard.speak_speed || 1.0,
      romanization_display: newDashboard.romanization_display || 'both'
    };
    setLanguageDashboards((prev: DashboardType[]) => [...prev, processedDashboard]);
    setShowLanguageOnboarding(false);
    setSelectedLanguage(newDashboard.language);
    // Persist immediately after onboarding
    localStorage.setItem('selectedLanguage', newDashboard.language);
  };

  const currentDashboard = languageDashboards.find((d: DashboardType) => d.language === selectedLanguage);
  if (currentDashboard) {
    currentDashboard.talk_topics = currentDashboard.talk_topics || [];
    currentDashboard.learning_goals = currentDashboard.learning_goals || [];
    currentDashboard.romanization_display = currentDashboard.romanization_display || 'both';
  }

  const [streak, setStreak] = useState<number>(0);
  useEffect(() => {
    async function fetchStreak() {
      if (user?.id && selectedLanguage) {
        try {
          const res = await axios.get(`/api/user/streak?userId=${user.id}&language=${selectedLanguage}`);
          setStreak(res.data.streak || 0);
        } catch (err) {
          setStreak(0);
        }
      }
    }
    fetchStreak();
  }, [user?.id, selectedLanguage]);

  const getLanguageInfo = (code: string): { label: string; flag: string } => {
    const languages: Record<string, { label: string; flag: string }> = {
      'en': { label: 'English', flag: '🇺🇸' },
      'es': { label: 'Spanish', flag: '🇪🇸' },
      'fr': { label: 'French', flag: '🇫🇷' },
      'zh': { label: 'Mandarin', flag: '🇨🇳' },
      'ja': { label: 'Japanese', flag: '🇯🇵' },
      'ko': { label: 'Korean', flag: '🇰🇷' },
      'tl': { label: 'Tagalog', flag: '🇵🇭' },
      'hi': { label: 'Hindi', flag: '🇮🇳' },
      'ml': { label: 'Malayalam', flag: '🇮🇳' },
      'ta': { label: 'Tamil', flag: '🇮🇳' },
      'or': { label: 'Odia', flag: '🇮🇳' },
      'ar': { label: 'Arabic', flag: '🇸🇦' }
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

  const handleDashboardUpdate = (updatedDashboard: DashboardType) => {
    setLanguageDashboards((prev: DashboardType[]) => 
      prev.map((d: DashboardType) => 
        d.language === updatedDashboard.language ? updatedDashboard : d
      )
    );
  };

  const toggleConversationExpansion = (conversationId: string) => {
    setExpandedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  };

  const getSummaryPreview = (synopsis: string) => {
    // Extract the first sentence or first 100 characters as preview
    const firstSentence = synopsis.split('.')[0];
    if (firstSentence.length > 100) {
      return firstSentence.substring(0, 100) + '...';
    }
    return firstSentence + (synopsis.includes('.') ? '.' : '');
  };

  const processSynopsisWithSubgoals = (synopsis: string, conversation: ConversationType, userSubgoalProgress: SubgoalProgress[]) => {
    if (!synopsis || !conversation.learning_goals) {
      return { type: 'plain', content: synopsis };
    }

    try {
      // Parse learning goals from conversation
      const learningGoals = typeof conversation.learning_goals === 'string' 
        ? JSON.parse(conversation.learning_goals) 
        : conversation.learning_goals;

      if (!Array.isArray(learningGoals) || learningGoals.length === 0) {
        return { type: 'plain', content: synopsis };
      }

      // Extract subgoal descriptions from LEARNING_GOALS with percentage info
      const subgoalDescriptions: { description: string; subgoalId: string; percentage: number }[] = [];
      let globalSubgoalIndex = 0; // Track the global index across all subgoals
      
      learningGoals.forEach((goalId: string) => {
        const goal = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
        if (goal?.subgoals) {
          goal.subgoals.forEach(subgoal => {
            if (subgoal.description) {
              // For recent conversations, use the original subgoal description (not leveled up)
              // and get the percentage from the conversation's progress data (historical)
              const originalDescription = subgoal.description;
              
              // Get the percentage from conversation's progress data (historical)
              let historicalPercentage = 0;
              if (conversation.progress_data) {
                try {
                  const progressData = typeof conversation.progress_data === 'string' 
                    ? JSON.parse(conversation.progress_data) 
                    : conversation.progress_data;
                  if (progressData.percentages && Array.isArray(progressData.percentages)) {
                    // Use the global index to get the correct percentage
                    if (globalSubgoalIndex < progressData.percentages.length) {
                      historicalPercentage = progressData.percentages[globalSubgoalIndex];
                    }
                  }
                } catch (error) {
                  console.error('Error parsing conversation progress data:', error);
                }
              }
              
              subgoalDescriptions.push({ 
                description: originalDescription, 
                subgoalId: subgoal.id,
                percentage: historicalPercentage
              });
              
              globalSubgoalIndex++; // Increment the global index
            }
          });
        }
      });

      // Parse the synopsis to extract individual evaluations
      const lines = synopsis.split('\n');
      const evaluations: { title: string; content: string; percentage: number }[] = [];
      
      let currentEvaluation = '';
      let currentTitle = '';
      let currentPercentage = 0;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Check if this line starts with a numbered subgoal (1:, 2:, 3:)
        const numberMatch = trimmedLine.match(/^(\d+):\s*(.*)/);
        if (numberMatch) {
          // Save previous evaluation if exists
          if (currentTitle && currentEvaluation) {
            evaluations.push({ title: currentTitle, content: currentEvaluation.trim(), percentage: currentPercentage });
          }
          
          // Start new evaluation
          const subgoalIndex = parseInt(numberMatch[1]) - 1;
          if (subgoalIndex < subgoalDescriptions.length) {
            currentTitle = subgoalDescriptions[subgoalIndex].description;
            currentPercentage = subgoalDescriptions[subgoalIndex].percentage;
          } else {
            currentTitle = `Subgoal ${numberMatch[1]}`;
            currentPercentage = 0;
          }
          currentEvaluation = numberMatch[2] || '';
        } else {
          // Continue current evaluation
          currentEvaluation += (currentEvaluation ? '\n' : '') + trimmedLine;
        }
      }
      
      // Add the last evaluation
      if (currentTitle && currentEvaluation) {
        evaluations.push({ title: currentTitle, content: currentEvaluation.trim(), percentage: currentPercentage });
      }

      return { type: 'structured', evaluations };
    } catch (error) {
      console.error('Error processing synopsis with subgoals:', error);
      return { type: 'plain', content: synopsis };
    }
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
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-heading font-bold text-rose-primary mb-2">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-rose-accent font-body">
            Your multilingual journey dashboard
          </p>
        </motion.div>
                  {/* Language Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200"
        >
          <h3 className="text-2xl font-heading font-semibold text-rose-primary mb-4">
            📚 Your Language Dashboards
          </h3>
          <div className="flex flex-wrap gap-6 items-center">
              {(languageDashboards || []).map((dashboard: DashboardType) => {
                const langInfo = getLanguageInfo(dashboard.language);
                const profInfo = getProficiencyDisplay(dashboard.proficiency_level);
                const isSelected = selectedLanguage === dashboard.language;
                return (
                  <button
                    key={dashboard.language}
                    onClick={() => setSelectedLanguage(dashboard.language)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      padding: '2rem 2.5rem',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      background: isSelected ? 'var(--rose-primary)' : 'var(--cream)',
                      color: isSelected ? '#fff' : 'var(--rose-primary)',
                      border: `2px solid ${isSelected ? 'var(--rose-accent)' : 'transparent'}`,
                      boxShadow: isSelected ? '0 4px 15px rgba(126,90,117,0.3)' : 'none'
                    }}
                  >
                    <span className="text-2xl">{langInfo.flag}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ 
                        color: isSelected ? '#fff' : 'var(--rose-primary)',
                        fontFamily: 'Gabriela, Arial, sans-serif',
                        fontWeight: 600
                      }}>{langInfo.label}</div>
                      <div style={{ 
                        color: isSelected ? '#fff' : 'var(--rose-accent)',
                        fontSize: '0.875rem',
                        opacity: 0.8,
                        fontFamily: 'AR One Sans, Arial, sans-serif'
                      }}>
                        {profInfo.icon} {profInfo.label}
                      </div>
                    </div>
                  </button>
                );
              })}
              {/* Add Language Button */}
              <button
                onClick={() => setShowLanguageOnboarding(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '2rem 2.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  border: '2px dashed rgba(126,90,117,0.4)',
                  color: 'var(--rose-primary)',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(126,90,117,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>➕</span>
                Add Language
              </button>
            </div>
          </motion.div>
        {/* Current Language Dashboard */}
        {currentDashboard && currentDashboard.language && (
          <>
            {/* Dashboard Header */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2rem' }}>{getLanguageInfo(currentDashboard.language).flag}</span>
                    <h2 style={{ 
                      color: 'var(--blue-secondary)', 
                      fontSize: '1.5rem', 
                      fontWeight: 700, 
                      margin: 0,
                      fontFamily: 'Gabriela, Arial, sans-serif'
                    }} className="font-heading">
                      {getLanguageInfo(currentDashboard.language).label}
                    </h2>
                    <span style={{ 
                      background: 'var(--rose-primary)', 
                      color: '#fff', 
                      padding: '0.3rem 0.75rem', 
                      borderRadius: 6, 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      fontFamily: 'Montserrat, Arial, sans-serif'
                    }}>
                      {getProficiencyDisplay(currentDashboard.proficiency_level).label}
                    </span>
                  </div>
                  <div style={{ 
                    color: 'var(--rose-primary)', 
                    fontSize: '0.9rem',
                    fontFamily: 'AR One Sans, Arial, sans-serif'
                  }} className="font-body">
                    {(currentDashboard.talk_topics?.length || 0)} topics • {(currentDashboard.learning_goals?.length || 0)} goals
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setShowDashboardSettings(true)}
                    style={{
                      background: 'transparent',
                      color: 'var(--rose-primary)',
                      border: '2px solid rgba(126,90,117,0.3)',
                      borderRadius: 8,
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontFamily: 'Montserrat, Arial, sans-serif'
                    }}
                  >
                    ⚙️ Settings
                  </button>
                  <Link 
                    href={`/analyze?language=${currentDashboard.language}`}
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                      color: '#fff',
                      padding: '0.75rem 1.5rem',
                      borderRadius: 10,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(126,90,117,0.3)',
                      fontFamily: 'Montserrat, Arial, sans-serif'
                    }}
                  >
                    🎤 Practice Now
                  </Link>
                </div>
              </div>
            </motion.div>
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
                              <div className="bg-white rounded-lg shadow-lg p-6 text-center min-h-[140px] flex flex-col justify-center border border-gray-200">
                  <div className="text-3xl mb-3">🔥</div>
                  <div className="text-3xl font-bold text-rose-accent mb-2 font-heading">{streak}</div>
                  <div className="text-rose-primary text-sm font-body">Day Streak</div>
                </div>
                              <div className="bg-white rounded-lg shadow-lg p-6 text-center min-h-[140px] flex flex-col justify-center border border-gray-200">
                  <div className="text-3xl mb-3">💬</div>
                  <div className="text-3xl font-bold text-rose-primary mb-2 font-heading">{(conversations || []).length}</div>
                  <div className="text-rose-primary text-sm font-base">Conversations</div>
                </div>
                              <div className="bg-white rounded-lg shadow-lg p-8 min-h-[300px] border border-gray-200 md:col-span-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>🎯</div>
                  <div style={{ 
                    color: 'var(--blue-secondary)', 
                    fontSize: '1.1rem', 
                    fontWeight: 600,
                    fontFamily: 'Gabriela, Arial, sans-serif'
                  }}>Learning Goals</div>
                </div>
                                {currentDashboard.learning_goals && currentDashboard.learning_goals.length > 0 ? (
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--rose-accent) transparent'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {currentDashboard.learning_goals.map((goalId: string, index: number) => {
                        const goal = LEARNING_GOALS.find(g => g.id === goalId);
                        if (!goal) return null;
                        
                        // Aggregate progress data from all conversations for this language
                        let aggregatedProgressData: number[] | undefined;
                        let userSubgoalProgress: SubgoalProgress[] = [];
                        
                        console.log('=== PROGRESS DATA AGGREGATION DEBUG ===');
                        console.log('Goal ID:', goalId);
                        console.log('Goal:', goal);
                        console.log('All conversations for progress aggregation:', conversations);
                        
                        if (conversations && conversations.length > 0) {
                          // Collect progress data only from conversations that practiced this specific goal
                          const relevantProgressData: number[][] = [];
                          
                          conversations.forEach(conversation => {
                            console.log('Checking conversation:', conversation.id, 'for progress_data');
                            
                            if (conversation.progress_data) {
                              try {
                                const progressData = typeof conversation.progress_data === 'string' 
                                  ? JSON.parse(conversation.progress_data) 
                                  : conversation.progress_data;
                                
                                // Check if this is the new format with goal information
                                if (progressData.goals && progressData.percentages) {
                                  // New format: { goals: [...], percentages: [...] }
                                  console.log('Found new format progress data:', progressData);
                                  
                                  // Check if this conversation practiced the current goal
                                  if (progressData.goals.includes(goalId)) {
                                    console.log('✅ Conversation practiced this goal, adding progress data');
                                    relevantProgressData.push(progressData.percentages);
                                  } else {
                                    console.log('❌ Conversation did not practice this goal, skipping');
                                  }
                                } else if (Array.isArray(progressData)) {
                                  // Old format: just array of percentages
                                  console.log('Found old format progress data:', progressData);
                                  
                                  // For old format, we need to check if the conversation has learning_goals
                                  if (conversation.learning_goals) {
                                    try {
                                      const conversationGoals = typeof conversation.learning_goals === 'string' 
                                        ? JSON.parse(conversation.learning_goals) 
                                        : conversation.learning_goals;
                                      
                                      if (conversationGoals.includes(goalId)) {
                                        console.log('✅ Conversation practiced this goal (old format), adding progress data');
                                        relevantProgressData.push(progressData);
                                      } else {
                                        console.log('❌ Conversation did not practice this goal (old format), skipping');
                                      }
                                    } catch (error) {
                                      console.error('Error parsing conversation learning goals:', error);
                                    }
                                  } else {
                                    console.log('❌ No learning_goals found in conversation, skipping old format data');
                                  }
                                } else {
                                  console.log('❌ Progress data is not in expected format for conversation:', conversation.id);
                                }
                              } catch (error) {
                                console.error('❌ Error parsing progress data from conversation:', conversation.id, error);
                              }
                            } else {
                              console.log('❌ No progress_data found in conversation:', conversation.id);
                            }
                          });
                          
                          console.log('Relevant progress data for this goal:', relevantProgressData);
                          
                          if (relevantProgressData.length > 0) {
                            // Calculate average progress for each subgoal across relevant conversations
                            const numSubgoals = Math.max(...relevantProgressData.map(data => data.length));
                            console.log('Number of subgoals to aggregate:', numSubgoals);
                            aggregatedProgressData = [];
                            
                                                    // Get user's current subgoal progress from localStorage
                        const storedProgress = localStorage.getItem(`subgoal_progress_${user?.id}_${selectedLanguage}`);
                        if (storedProgress) {
                          try {
                            userSubgoalProgress = JSON.parse(storedProgress);
                            console.log('Loaded userSubgoalProgress from localStorage:', userSubgoalProgress);
                          } catch (error) {
                            console.error('Error parsing stored subgoal progress:', error);
                          }
                        } else {
                          console.log('No stored subgoal progress found in localStorage');
                        }
                            
                            for (let i = 0; i < numSubgoals; i++) {
                              const subgoalProgresses = relevantProgressData
                                .map(data => data[i])
                                .filter(progress => progress !== undefined && progress !== null);
                              
                              console.log(`Subgoal ${i + 1} progresses:`, subgoalProgresses);
                              
                              if (subgoalProgresses.length > 0) {
                                // Calculate average progress for this subgoal
                                const averageProgress = Math.round(
                                  subgoalProgresses.reduce((sum, progress) => sum + progress, 0) / subgoalProgresses.length
                                );
                                aggregatedProgressData.push(averageProgress);
                                console.log(`Subgoal ${i + 1} average progress:`, averageProgress);
                              } else {
                                aggregatedProgressData.push(0);
                                console.log(`Subgoal ${i + 1} no progress data, defaulting to 0`);
                              }
                            }
                            
                            console.log('Final aggregated progress data for this goal:', aggregatedProgressData);
                          } else {
                            console.log('No relevant progress data found for this goal');
                          }
                        } else {
                          console.log('No conversations available for progress data');
                        }
                        console.log('=== END PROGRESS DATA AGGREGATION DEBUG ===');
                        
                        return (
                          <LearningGoalCard 
                            key={goalId} 
                            goal={goal} 
                            index={index} 
                            progressData={aggregatedProgressData}
                            userSubgoalProgress={userSubgoalProgress}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    color: 'var(--rose-primary)', 
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    fontFamily: 'AR One Sans, Arial, sans-serif'
                  }}>
                    No goals set yet
                  </div>
                )}
              </div>
            </motion.div>

            {/* Saved Personas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-lg p-8 border border-gray-200"
            >
              <h3 style={{ 
                color: 'var(--rose-primary)', 
                fontSize: '1.3rem', 
                fontWeight: 600, 
                marginBottom: '1rem',
                fontFamily: 'Gabriela, Arial, sans-serif'
              }} className="font-heading">
                🎭 Saved Personas
              </h3>
              {loading ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: 'var(--rose-primary)',
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }} className="font-body">Loading personas...</div>
              ) : (personas || []).length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: 'var(--rose-primary)', 
                  background: 'rgba(126,90,117,0.05)', 
                  borderRadius: 12, 
                  border: '2px dashed rgba(126,90,117,0.2)',
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }} className="font-body">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎭</div>
                  <div style={{ 
                    fontWeight: 600, 
                    marginBottom: '0.5rem',
                    fontFamily: 'Gabriela, Arial, sans-serif'
                  }}>No personas saved yet</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    End a conversation to save it as a reusable persona
                  </div>
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  overflowX: 'auto', 
                  padding: '0.5rem 0',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--rose-accent) transparent'
                }}>
                  {(personas || []).map((persona: PersonaType) => (
                    <div 
                      key={persona.id} 
                      style={{ 
                        minWidth: '200px',
                        maxWidth: '200px',
                        background: 'rgba(126,90,117,0.05)', 
                        borderRadius: 16, 
                        padding: '1.5rem', 
                        border: '2px solid rgba(126,90,117,0.1)', 
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(126,90,117,0.15)';
                        e.currentTarget.style.borderColor = 'rgba(126,90,117,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = 'rgba(126,90,117,0.1)';
                      }}
                    >
                      {/* Profile Icon */}
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto',
                        fontSize: '1.5rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontFamily: 'Montserrat, Arial, sans-serif'
                      }}>
                        {persona.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Persona Name */}
                      <div style={{ 
                        textAlign: 'center',
                        fontWeight: 600, 
                        color: 'var(--rose-primary)',
                        fontSize: '1rem',
                        marginBottom: '0.5rem',
                        fontFamily: 'Montserrat, Arial, sans-serif'
                      }} className="font-body">
                        {persona.name}
                      </div>
                      
                      {/* Description Preview */}
                      {persona.description && (
                        <div style={{ 
                          color: 'var(--rose-accent)', 
                          fontSize: '0.8rem', 
                          textAlign: 'center',
                          marginBottom: '0.75rem',
                          lineHeight: '1.3',
                          fontFamily: 'AR One Sans, Arial, sans-serif',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }} className="font-body">
                          {persona.description}
                        </div>
                      )}
                      
                      {/* Tags */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          gap: '0.25rem'
                        }}>
                          <span style={{ 
                            background: 'rgba(126,90,117,0.1)', 
                            color: 'var(--rose-primary)', 
                            padding: '0.15rem 0.4rem', 
                            borderRadius: 8, 
                            fontSize: '0.65rem',
                            fontFamily: 'AR One Sans, Arial, sans-serif',
                            fontWeight: 500
                          }}>
                            {getLanguageInfo(persona.language).flag} {persona.language.toUpperCase()}
                          </span>
                          <span style={{ 
                            background: 'rgba(126,90,117,0.1)', 
                            color: 'var(--rose-primary)', 
                            padding: '0.15rem 0.4rem', 
                            borderRadius: 8, 
                            fontSize: '0.65rem',
                            fontFamily: 'AR One Sans, Arial, sans-serif',
                            fontWeight: 500
                          }}>
                            {persona.formality}
                          </span>
                        </div>
                        {persona.topics.length > 0 && (
                          <div style={{ 
                            textAlign: 'center',
                            color: 'var(--rose-accent)', 
                            fontSize: '0.7rem',
                            fontFamily: 'AR One Sans, Arial, sans-serif',
                            opacity: 0.8
                          }}>
                            {persona.topics.slice(0, 2).join(', ')}
                            {persona.topics.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePersona(persona.id);
                        }}
                        style={{ 
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          color: '#dc3545', 
                          background: 'rgba(220,53,69,0.1)', 
                          border: 'none', 
                          borderRadius: '50%', 
                          width: '24px', 
                          height: '24px', 
                          fontSize: '0.7rem', 
                          cursor: 'pointer', 
                          transition: 'all 0.3s ease',
                          fontFamily: 'Montserrat, Arial, sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete persona"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(220,53,69,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(220,53,69,0.1)';
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Recent Conversations */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-lg p-8 border border-gray-200"
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ 
                  color: 'var(--blue-secondary)', 
                  fontSize: '1.3rem', 
                  fontWeight: 600,
                  fontFamily: 'Gabriela, Arial, sans-serif'
                }} className="font-heading">
                  Recent Conversations
                </h3>
                <button
                  onClick={() => {
                    // Debug: Check localStorage state
                    const storedProgress = localStorage.getItem(`subgoal_progress_${user?.id}_${selectedLanguage}`);
                    console.log('Current localStorage subgoal progress:', storedProgress);
                    if (storedProgress) {
                      try {
                        const parsed = JSON.parse(storedProgress);
                        console.log('Parsed subgoal progress:', parsed);
                      } catch (error) {
                        console.error('Error parsing localStorage:', error);
                      }
                    }
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid var(--rose-accent)',
                    borderRadius: '4px',
                    background: 'transparent',
                    color: 'var(--rose-accent)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    fontFamily: 'Montserrat, Arial, sans-serif'
                  }}
                >
                  🔍 Debug
                </button>
              </div>
              {loading ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: 'var(--rose-primary)',
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }} className="font-body">Loading conversations...</div>
              ) : error ? (
                <div style={{ 
                  color: '#dc3545', 
                  textAlign: 'center', 
                  padding: '2rem',
                  fontFamily: 'Montserrat, Arial, sans-serif'
                }} className="font-body">{error}</div>
              ) : (conversations || []).length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: 'var(--rose-primary)', 
                  background: 'rgba(126,90,117,0.05)', 
                  borderRadius: 12, 
                  border: '2px dashed rgba(126,90,117,0.2)',
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }} className="font-body">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎤</div>
                  <div style={{ 
                    fontWeight: 600, 
                    marginBottom: '0.5rem',
                    fontFamily: 'Gabriela, Arial, sans-serif'
                  }}>Start your first conversation!</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    Click &quot;Practice Now&quot; to begin learning {currentDashboard ? getLanguageInfo(currentDashboard.language).label : 'your language'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(conversations || []).slice(0, 5).map((conversation: ConversationType) => {
                    // Get user subgoal progress for this language
                    const storedProgress = localStorage.getItem(`subgoal_progress_${user?.id}_${selectedLanguage}`);
                    let userSubgoalProgress: SubgoalProgress[] = [];
                    if (storedProgress) {
                      try {
                        userSubgoalProgress = JSON.parse(storedProgress);
                      } catch (error) {
                        console.error('Error parsing stored subgoal progress:', error);
                      }
                    }
                    return (
                    <div key={conversation.id} style={{ background: 'rgba(126,90,117,0.05)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(126,90,117,0.1)', transition: 'all 0.3s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                          {/* Persona Indicator */}
                          {conversation.uses_persona && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.25rem',
                              background: 'rgba(126,90,117,0.1)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 8,
                              fontSize: '0.7rem',
                              color: 'var(--rose-primary)',
                              fontWeight: 500,
                              fontFamily: 'Montserrat, Arial, sans-serif',
                              flexShrink: 0
                            }}>
                              🎭 {conversation.persona_name || 'Persona'}
                            </div>
                          )}
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                              <div style={{ 
                                fontWeight: 600, 
                                color: 'var(--blue-secondary)',
                                fontFamily: 'Montserrat, Arial, sans-serif',
                                flex: '1 1 auto',
                                minWidth: 0
                              }} className="font-body">
                                {conversation.title || 'Untitled Conversation'}
                              </div>
                              <div style={{ 
                                color: 'var(--rose-primary)', 
                                fontSize: '0.8rem',
                                fontFamily: 'AR One Sans, Arial, sans-serif',
                                flexShrink: 0
                              }} className="font-body">
                                {new Date(conversation.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            {conversation.persona_description && (
                              <div style={{ 
                                color: 'var(--rose-accent)', 
                                fontSize: '0.8rem', 
                                marginBottom: '0.25rem',
                                fontFamily: 'AR One Sans, Arial, sans-serif',
                                fontStyle: 'italic'
                              }} className="font-body">
                                "{conversation.persona_description}"
                              </div>
                            )}
                            {conversation.message_count && conversation.message_count > 0 && (
                              <div style={{ 
                                color: 'var(--rose-primary)', 
                                fontSize: '0.9rem', 
                                opacity: 0.8,
                                fontFamily: 'AR One Sans, Arial, sans-serif'
                              }} className="font-body">
                                💬 {conversation.message_count} messages
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexShrink: 0, marginLeft: '0.5rem' }}>
                          <Link 
                            href={`/analyze?conversation=${conversation.id}&language=${currentDashboard.language}`}
                            style={{ 
                              color: 'var(--rose-primary)', 
                              fontWeight: 600, 
                              textDecoration: 'none', 
                              fontSize: '0.9rem', 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: 6, 
                              background: 'rgba(126,90,117,0.1)', 
                              transition: 'all 0.3s ease',
                              fontFamily: 'Montserrat, Arial, sans-serif'
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
                              transition: 'all 0.3s ease',
                              fontFamily: 'Montserrat, Arial, sans-serif'
                            }}
                            title="Delete conversation"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Show summary if it exists */}
                      {conversation.synopsis && (
                        <div style={{ 
                          marginTop: '0.75rem',
                          background: 'rgba(126,90,117,0.05)',
                          padding: '0.75rem',
                          borderRadius: 8,
                          border: '1px solid rgba(126,90,117,0.1)',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => toggleConversationExpansion(conversation.id)}
                              style={{ 
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                color: 'var(--rose-primary)', 
                                background: 'transparent', 
                                border: 'none', 
                                fontSize: '0.8rem', 
                                cursor: 'pointer', 
                                fontWeight: 600,
                                fontFamily: 'Montserrat, Arial, sans-serif',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem',
                                borderRadius: '4px',
                                transition: 'all 0.3s ease',
                                zIndex: 10
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(126,90,117,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {expandedConversations.has(conversation.id) ? 'Show Less ↑' : 'Show Details ↓'}
                            </button>
                            
                            <div style={{ 
                              color: 'var(--blue-secondary)', 
                              fontSize: '0.9rem',
                              lineHeight: 1.6,
                              fontFamily: 'AR One Sans, Arial, sans-serif',
                              wordBreak: 'break-word',
                              paddingTop: '2rem', // Space for the button
                              maxHeight: expandedConversations.has(conversation.id) ? '1000px' : '4.5rem', // Animate height
                              overflow: 'hidden',
                              transition: 'max-height 0.3s ease',
                              whiteSpace: expandedConversations.has(conversation.id) ? 'pre-wrap' : 'normal'
                                                          }} className="font-body">
                                {expandedConversations.has(conversation.id) 
                                                    ? (() => {
                      const processed = processSynopsisWithSubgoals(conversation.synopsis || '', conversation, userSubgoalProgress || []);
                                                                             if (processed.type === 'structured' && processed.evaluations) {
                                         return (
                                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                             {processed.evaluations.map((evaluation, index) => (
                                              <div key={index} style={{
                                                background: 'rgba(126,90,117,0.03)',
                                                border: '1px solid rgba(126,90,117,0.1)',
                                                borderRadius: '8px',
                                                padding: '0.75rem',
                                                marginBottom: '0.5rem'
                                              }}>
                                                                              <div style={{
                                fontWeight: 600,
                                color: 'var(--blue-secondary)',
                                fontSize: '0.85rem',
                                marginBottom: '0.5rem',
                                fontFamily: 'Montserrat, Arial, sans-serif',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <span>{evaluation.title}</span>
                                <span style={{
                                  color: 'var(--rose-primary)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  fontFamily: 'Montserrat, Arial, sans-serif'
                                }}>
                                  {evaluation.percentage}%
                                </span>
                              </div>
                                                                                                 <div style={{
                                                   color: 'var(--rose-primary)',
                                                   fontSize: '0.8rem',
                                                   lineHeight: 1.5,
                                                   fontFamily: 'AR One Sans, Arial, sans-serif'
                                                 }}>
                                                   {evaluation.content}
                                                 </div>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      } else {
                                        return processed.content;
                                      }
                                    })()
                                                                                                                            : (() => {
                      const processed = processSynopsisWithSubgoals(conversation.synopsis || '', conversation, userSubgoalProgress || []);
                                       if (processed.type === 'structured' && processed.evaluations) {
                                         // For preview, show structured preview with first evaluation
                                         const firstEvaluation = processed.evaluations[0];
                                         if (firstEvaluation) {
                                           return (
                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                               <div style={{
                                                 background: 'rgba(126,90,117,0.03)',
                                                 border: '1px solid rgba(126,90,117,0.1)',
                                                 borderRadius: '8px',
                                                 padding: '0.5rem'
                                               }}>
                                                 <div style={{
                                                   fontWeight: 600,
                                                   color: 'var(--blue-secondary)',
                                                   fontSize: '0.8rem',
                                                   marginBottom: '0.25rem',
                                                   fontFamily: 'Montserrat, Arial, sans-serif'
                                                 }}>
                                                   {firstEvaluation.title}
                                                 </div>
                                                 <div style={{
                                                   color: 'var(--rose-primary)',
                                                   fontSize: '0.75rem',
                                                   lineHeight: 1.4,
                                                   fontFamily: 'AR One Sans, Arial, sans-serif'
                                                 }}>
                                                   {firstEvaluation.content.substring(0, 120)}...
                                                 </div>
                                               </div>
                                               {processed.evaluations.length > 1 && (
                                                 <div style={{
                                                   color: 'var(--rose-accent)',
                                                   fontSize: '0.7rem',
                                                   fontStyle: 'italic',
                                                   fontFamily: 'AR One Sans, Arial, sans-serif'
                                                 }}>
                                                   +{processed.evaluations.length - 1} more evaluations
                                                 </div>
                                               )}
                                             </div>
                                           );
                                         }
                                       }
                                       return getSummaryPreview(processed.content || '');
                                     })()
                                }
                              </div>
                          </div>
                        </div>
                      )}
                      {!conversation.synopsis && (
                        <div style={{ 
                          color: 'var(--rose-primary)', 
                          fontSize: '0.8rem',
                          fontStyle: 'italic',
                          marginTop: '0.5rem'
                        }}>
                          No synopsis available
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </motion.div>
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
          onDelete={(language: string) => {
            setLanguageDashboards((prev: DashboardType[]) => prev.filter((d: DashboardType) => d.language !== language));
            if (selectedLanguage === language) {
              const remainingDashboards = languageDashboards.filter((d: DashboardType) => d.language !== language);
              const newSelectedLanguage = remainingDashboards[0]?.language;
              setSelectedLanguage(newSelectedLanguage);
            }
          }}
        />
      )}
    </div>
  );
} 
