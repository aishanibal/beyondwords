'use client';
import React, { useState, useEffect } from 'react';

import { Topic, TALK_TOPICS, PROFICIENCY_LEVELS, LEARNING_GOALS, LearningGoal, ProficiencyLevel } from '../../lib/preferences';

// Type definitions
interface DashboardType {
  language: string;
  proficiency_level: string;
  talk_topics: string[];
  learning_goals: string[];
  speak_speed?: number;
  romanization_display?: string; // 'both', 'script_only', 'romanized_only'
  is_primary?: boolean;
}

interface DashboardSettingsModalProps {
  dashboard: DashboardType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (dashboard: DashboardType) => void;
  onDelete?: (language: string) => void;
}

// Script languages that need romanization
const SCRIPT_LANGUAGES = {
  'hi': 'Devanagari',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'ta': 'Tamil',
  'ml': 'Malayalam',
  'or': 'Odia'
};

const isScriptLanguage = (languageCode: string): boolean => {
  return languageCode in SCRIPT_LANGUAGES;
};

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

export default function DashboardSettingsModal({ 
  dashboard, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete 
}: DashboardSettingsModalProps) {
  const [editedDashboard, setEditedDashboard] = useState<DashboardType>(dashboard);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');

  useEffect(() => {
    if (dashboard) {
      console.log('[DEBUG] Dashboard data received:', dashboard);
      console.log('[DEBUG] Is script language:', isScriptLanguage(dashboard.language));
      console.log('[DEBUG] Current romanization_display:', dashboard.romanization_display);
      
      setEditedDashboard({
        ...dashboard,
        talk_topics: dashboard.talk_topics || [],
        learning_goals: dashboard.learning_goals || [],
        speak_speed: dashboard.speak_speed || 1.0,
        romanization_display: isScriptLanguage(dashboard.language) ? (dashboard.romanization_display || 'both') : undefined
      });
      
      console.log('[DEBUG] Edited dashboard initialized:', {
        ...dashboard,
        talk_topics: dashboard.talk_topics || [],
        learning_goals: dashboard.learning_goals || [],
        speak_speed: dashboard.speak_speed || 1.0,
        romanization_display: isScriptLanguage(dashboard.language) ? (dashboard.romanization_display || 'both') : undefined
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

  const handleLearningGoalToggle = (goalId: string) => {
    setEditedDashboard((prev: DashboardType) => ({
      ...prev,
      learning_goals: prev.learning_goals.includes(goalId)
        ? prev.learning_goals.filter((id: string) => id !== goalId)
        : [...prev.learning_goals, goalId]
    }));
  };

        const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const token = localStorage.getItem('jwt');
      const updateData: any = {
        proficiency_level: editedDashboard.proficiency_level,
        talk_topics: editedDashboard.talk_topics,
        learning_goals: editedDashboard.learning_goals,
        speak_speed: editedDashboard.speak_speed
      };

      // Only include romanization_display for script languages
      if (isScriptLanguage(dashboard.language)) {
        updateData.romanization_display = editedDashboard.romanization_display;
        console.log('[DEBUG] Saving romanization_display:', editedDashboard.romanization_display);
      }

      console.log('[DEBUG] Saving dashboard data:', updateData);
      console.log('[DEBUG] Language:', dashboard.language);
      console.log('[DEBUG] Is script language:', isScriptLanguage(dashboard.language));

      // TODO: Implement dashboard update with Firestore
      // For now, just call onUpdate with the edited data
      console.log('[DEBUG] Would save dashboard data:', updateData);
      onUpdate(editedDashboard);
      onClose();
    } catch (err: any) {
      console.error('[DEBUG] Save error:', err);
      setSaveError('Failed to update dashboard settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

    const handleCancel = () => {
      onClose();
    };

  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete your ${getLanguageInfo(dashboard.language).label} dashboard? This will permanently delete all conversations and messages in this language. This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setIsDeleting(true);
    setSaveError('');
    try {
      // TODO: Implement dashboard deletion with Firestore
      // For now, just call onDelete
      console.log('[DEBUG] Would delete dashboard for language:', dashboard.language);
      if (onDelete) {
        onDelete(dashboard.language);
      }
      onClose();
    } catch (err: any) {
      setSaveError('Failed to delete dashboard. Please try again.');
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
          maxWidth: 'min(1200px, 98vw)',
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
            marginBottom: '0.5rem'
          }} className="font-heading">
            Dashboard Settings
          </h2>
          <p style={{ color: '#7e5a75', fontSize: '0.9rem', margin: 0 }} className="font-body">
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
          }} className="font-heading">
            📊 Proficiency Level
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '0.5rem'
          }}>
                         {PROFICIENCY_LEVELS.map(level => {
               const isSelected = editedDashboard.proficiency_level === level.level;
               const profInfo = getProficiencyDisplay(level.level);
               
               return (
                 <button
                   key={level.level}
                   onClick={() => setEditedDashboard((prev: DashboardType) => ({ ...prev, proficiency_level: level.level }))}
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
          }} className="font-heading">
            💬 Conversation Topics
          </h3>
          <p style={{ 
            color: '#7e5a75', 
            fontSize: '0.85rem', 
            marginBottom: '1rem',
            lineHeight: 1.4
          }} className="font-body">
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
                  }} className="font-body">
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

        {/* Learning Goals */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            color: '#3c4c73', 
            fontSize: '1.1rem', 
            fontWeight: 600, 
            marginBottom: '1rem'
          }} className="font-heading">
            🎯 Learning Goals
          </h3>
          <p style={{ 
            color: '#7e5a75', 
            fontSize: '0.85rem', 
            marginBottom: '1rem',
            lineHeight: 1.4
          }} className="font-body">
            Choose your learning objectives. You can select multiple goals.
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '0.5rem'
          }}>
            {LEARNING_GOALS.map((goal: LearningGoal) => {
              const isSelected = editedDashboard.learning_goals.includes(goal.id);
              
              return (
                <div
                  key={goal.id}
                  onClick={() => handleLearningGoalToggle(goal.id)}
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
                  <div style={{ fontSize: '1.2rem' }}>{goal.icon}</div>
                  <div style={{ 
                    fontWeight: 500, 
                    color: '#3c4c73', 
                    fontSize: '0.85rem',
                    flex: 1
                  }} className="font-body">
                                         {goal.goal}
                  </div>
                  {isSelected && (
                    <div style={{ color: '#7e5a75', fontSize: '1rem' }}>✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Speak Speed */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            color: '#3c4c73', 
            fontSize: '1.1rem', 
            fontWeight: 600, 
            marginBottom: '1rem'
          }} className="font-heading">
            🎤 Speak Speed
          </h3>
          <p style={{ 
            color: '#7e5a75', 
            fontSize: '0.85rem', 
            marginBottom: '1rem',
            lineHeight: 1.4
          }} className="font-body">
            Adjust how fast the AI speaks during conversations. Slower speeds are better for beginners.
          </p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(126,90,117,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(126,90,117,0.1)'
          }}>
            <span style={{ 
              color: '#7e5a75', 
              fontSize: '0.9rem', 
              fontWeight: 600,
              minWidth: '60px'
            }}>
              Slow
            </span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={editedDashboard.speak_speed || 1.0}
              onChange={(e) => setEditedDashboard((prev: DashboardType) => ({ 
                ...prev, 
                speak_speed: parseFloat(e.target.value) 
              }))}
              style={{
                flex: 1,
                height: '8px',
                borderRadius: '4px',
                background: 'linear-gradient(to right, #7e5a75 0%, #7e5a75 50%, #c38d94 100%)',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
            <span style={{ 
              color: '#7e5a75', 
              fontSize: '0.9rem', 
              fontWeight: 600,
              minWidth: '60px'
            }}>
              Fast
            </span>
            <div style={{
              background: '#7e5a75',
              color: '#fff',
              padding: '0.3rem 0.75rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              minWidth: '50px',
              textAlign: 'center'
            }}>
              {editedDashboard.speak_speed?.toFixed(1) || '1.0'}x
            </div>
          </div>
        </div>

        {/* Romanization Display - Only for Script Languages */}
        {isScriptLanguage(dashboard.language) && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              color: '#3c4c73', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              marginBottom: '1rem'
            }} className="font-heading">
              🔤 Romanization Display
            </h3>
            <p style={{ 
              color: '#7e5a75', 
              fontSize: '0.85rem', 
              marginBottom: '1rem',
              lineHeight: 1.4
            }} className="font-body">
              Choose how the AI displays romanized text for {getLanguageInfo(dashboard.language).label}.
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '0.5rem'
            }}>
              {['both', 'script_only', 'romanized_only'].map(display => {
                const isSelected = editedDashboard.romanization_display === display;
                return (
                  <button
                    key={display}
                    onClick={() => setEditedDashboard((prev: DashboardType) => ({ ...prev, romanization_display: display }))}
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
                    <div style={{ fontSize: '1.2rem' }}>{display === 'both' ? '🔤' : display === 'script_only' ? '👁️' : '👄'}</div>
                    <div style={{ 
                      fontWeight: 500, 
                      color: '#3c4c73', 
                      fontSize: '0.85rem',
                      flex: 1
                    }} className="font-body">
                      {display === 'both' ? 'Both Script and Romanized' : display === 'script_only' ? 'Only Script' : 'Only Romanized'}
                    </div>
                    {isSelected && (
                      <div style={{ color: '#7e5a75', fontSize: '1rem' }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
          }} className="font-body">
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
              onClick={handleCancel}
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
} 