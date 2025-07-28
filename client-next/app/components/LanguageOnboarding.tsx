/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../ClientLayout';
import axios from 'axios';
import { LANGUAGES, FEEDBACK_LANGUAGES, Language, ProficiencyLevel, Topic, LearningGoal, PracticePreference, FeedbackLanguage } from '../../lib/preferences';

const PROFICIENCY_LEVELS: ProficiencyLevel[] = [
  { level: 'beginner', label: 'Beginner', description: 'I can use simple greetings and a handful of words, but struggle to form sentences.', icon: '🌱' },
  { level: 'elementary', label: 'Elementary', description: 'I can handle basic everyday interactions in short, simple sentences.', icon: '🌿' },
  { level: 'intermediate', label: 'Intermediate', description: 'I can discuss familiar topics, understand main points, and ask questions.', icon: '🌳' },
  { level: 'advanced', label: 'Advanced', description: 'I can express detailed ideas, adapt my language, and engage comfortably in conversation.', icon: '🏔️' },
  { level: 'fluent', label: 'Fluent', description: 'I speak effortlessly, understand nuances, and participate in complex discussions.', icon: '🗝️' }
];

const TALK_TOPICS: Topic[] = [
  { id: 'family', label: 'Family and relationships', icon: '👨‍👩‍👧‍👦' },
  { id: 'travel', label: 'Travel experiences and cultures', icon: '✈️' },
  { id: 'heritage', label: 'Cultural heritage and traditions', icon: '🏛️' },
  { id: 'business', label: 'Work and professional life', icon: '💼' },
  { id: 'media', label: 'Movies, music, and media', icon: '🎬' },
  { id: 'food', label: 'Food and cooking', icon: '🍽️' },
  { id: 'hobbies', label: 'Hobbies and leisure activities', icon: '🎨' },
  { id: 'news', label: 'News and current events', icon: '📰' },
  { id: 'sports', label: 'Sports and fitness', icon: '⚽️' }
];

const LEARNING_GOALS: LearningGoal[] = [
  { id: 'confidence', label: 'Build speaking confidence', icon: '💪' },
  { id: 'pronunciation', label: 'Improve pronunciation and accent', icon: '🗣️' },
  { id: 'fluency', label: 'Achieve conversational fluency', icon: '💬' },
  { id: 'vocabulary', label: 'Expand vocabulary', icon: '📚' },
  { id: 'grammar', label: 'Master grammar structures', icon: '🔤' },
  { id: 'listening', label: 'Enhance listening comprehension', icon: '👂' }
];

const PRACTICE_PREFERENCES: PracticePreference[] = [
  { id: 'daily_short', label: 'Daily short sessions (5-15 minutes)', description: 'Perfect for busy schedules - quick daily practice with focused exercises' },
  { id: 'few_times_week', label: 'Few times a week (20-30 minutes)', description: 'Balanced approach with deeper practice sessions when you have time' },
  { id: 'weekly_long', label: 'Weekly longer sessions (45+ minutes)', description: 'Intensive practice with comprehensive lessons and conversations' },
  { id: 'flexible', label: 'Flexible scheduling', description: 'Adapt to your schedule - practice when you can, for as long as you want' }
];

interface LanguageOnboardingProps {
  onComplete: (dashboard: any) => void;
  existingLanguages?: string[];
}

function LanguageOnboarding({ onComplete, existingLanguages = [] }: LanguageOnboardingProps) {
  const { setUser } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  interface OnboardingData {
    language: string;
    proficiency: string;
    talkTopics: string[];
    learningGoals: string[];
    practicePreference: string;
    feedbackLanguage: string;
  }
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    language: '',
    proficiency: '',
    talkTopics: [],
    learningGoals: [],
    practicePreference: '',
    feedbackLanguage: 'en'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 4;
  const availableLanguages: Language[] = LANGUAGES.filter((lang: Language) => !existingLanguages.includes(lang.code));

  const updateOnboardingData = (field: keyof OnboardingData, value: string | string[]) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTalkTopic = (topicId: string) => {
    setOnboardingData(prev => ({
      ...prev,
      talkTopics: prev.talkTopics.includes(topicId)
        ? prev.talkTopics.filter((id: string) => id !== topicId)
        : [...prev.talkTopics, topicId]
    }));
  };

  const toggleLearningGoal = (goalId: string) => {
    setOnboardingData(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(goalId)
        ? prev.learningGoals.filter((id: string) => id !== goalId)
        : [...prev.learningGoals, goalId]
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1: return onboardingData.language !== '';
      case 2: return onboardingData.proficiency !== '';
      case 3: return onboardingData.talkTopics.length > 0 && onboardingData.learningGoals.length > 0;
      case 4: return onboardingData.practicePreference !== '';
      default: return false;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      setError(getStepError());
      return;
    }
    nextStep();
  };

  const getStepError = () => {
    switch (currentStep) {
      case 1: return 'Please select a language to learn.';
      case 2: return 'Please select your proficiency level.';
      case 3: return 'Please select at least one topic to talk about and one learning goal.';
      case 4: return 'Please select your practice preference.';
      default: return 'Please complete this step.';
    }
  };

  const renderFeedbackLanguageSelector = () => (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ color: '#3c4c73', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Feedback Language
      </h3>
      <p style={{ color: '#7e5a75', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
        Choose the language in which you want to receive AI feedback and explanations.
      </p>
      <select
        value={onboardingData.feedbackLanguage}
        onChange={e => setOnboardingData(prev => ({ ...prev, feedbackLanguage: e.target.value }))}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '2px solid #c38d94',
          fontSize: '1rem',
          background: '#f8f6f4',
          color: '#3c4c73',
          marginBottom: '1rem'
        }}
      >
        {FEEDBACK_LANGUAGES.map((lang: FeedbackLanguage) => (
          <option key={lang.code} value={lang.code}>{lang.label}</option>
        ))}
      </select>
    </div>
  );

  const handleSubmit = async () => {
    if (!validateStep()) {
      setError(getStepError());
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post('/api/user/language-dashboards', {
        language: onboardingData.language,
        proficiency: onboardingData.proficiency,
        talkTopics: onboardingData.talkTopics,
        learningGoals: onboardingData.learningGoals,
        practicePreference: onboardingData.practicePreference,
        feedbackLanguage: onboardingData.feedbackLanguage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onComplete) {
        onComplete(response.data.dashboard);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Failed to create language dashboard. Please try again.');
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ color: '#7e5a75', fontSize: '0.9rem', fontWeight: 600 }}>Step {currentStep} of {totalSteps}</span>
        <span style={{ color: '#7e5a75', fontSize: '0.9rem' }}>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: '6px', 
        backgroundColor: 'rgba(126,90,117,0.2)', 
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(currentStep / totalSteps) * 100}%`,
          height: '100%',
          backgroundColor: '#7e5a75',
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }}></div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h2 style={{ color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
        Add a new language
      </h2>
      <p style={{ color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }}>
        Choose another language you want to practice speaking with AI feedback
      </p>
      {availableLanguages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#7e5a75', marginBottom: '2rem' }}>
          <p>You already have dashboards for all available languages!</p>
          <p>You can edit your existing language settings from the dashboard.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {availableLanguages.map((lang: Language) => (
            <div
              key={lang.code}
              onClick={() => updateOnboardingData('language', lang.code)}
              style={{
                padding: '1.5rem',
                borderRadius: '12px',
                border: `2px solid ${onboardingData.language === lang.code ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                backgroundColor: onboardingData.language === lang.code ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{lang.flag}</div>
              <div style={{ fontWeight: 600, color: '#3c4c73', marginBottom: '0.25rem' }}>{lang.label}</div>
              <div style={{ fontSize: '0.9rem', color: '#7e5a75' }}>{lang.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 style={{ color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
        What's your current level?
      </h2>
      <p style={{ color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }}>
        Be honest - this helps us personalize your experience
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {PROFICIENCY_LEVELS.map((level: ProficiencyLevel) => (
          <div
            key={level.level}
            onClick={() => updateOnboardingData('proficiency', level.level)}
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              border: `2px solid ${onboardingData.proficiency === level.level ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
              backgroundColor: onboardingData.proficiency === level.level ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div style={{ fontSize: '2rem' }}>{level.icon}</div>
            <div>
              <div style={{ fontWeight: 600, color: '#3c4c73', marginBottom: '0.25rem' }}>{level.label}</div>
              <div style={{ fontSize: '0.9rem', color: '#7e5a75' }}>{level.description}</div>
            </div>
          </div>
        ))}
      </div>
      {renderFeedbackLanguageSelector()}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 style={{ color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
        What would you like to focus on?
      </h2>
      <p style={{ color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }}>
        Choose topics you'd like to discuss and skills you want to develop
      </p>
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ color: '#3c4c73', fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          💬 Topics I'd like to talk about
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {TALK_TOPICS.map((topic: Topic) => (
            <div
              key={topic.id}
              onClick={() => toggleTalkTopic(topic.id)}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${onboardingData.talkTopics.includes(topic.id) ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                backgroundColor: onboardingData.talkTopics.includes(topic.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div style={{ fontSize: '1.2rem' }}>{topic.icon}</div>
              <div style={{ fontWeight: 500, color: '#3c4c73', fontSize: '0.9rem' }}>{topic.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 style={{ color: '#3c4c73', fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎯 Skills I want to develop
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {LEARNING_GOALS.map((goal: LearningGoal) => (
            <div
              key={goal.id}
              onClick={() => toggleLearningGoal(goal.id)}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${onboardingData.learningGoals.includes(goal.id) ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                backgroundColor: onboardingData.learningGoals.includes(goal.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div style={{ fontSize: '1.2rem' }}>{goal.icon}</div>
              <div style={{ fontWeight: 500, color: '#3c4c73', fontSize: '0.9rem' }}>{goal.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h2 style={{ color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
        How do you prefer to practice?
      </h2>
      <p style={{ color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }}>
        Choose what works best for your schedule
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {PRACTICE_PREFERENCES.map((pref: PracticePreference) => (
          <div
            key={pref.id}
            onClick={() => updateOnboardingData('practicePreference', pref.id)}
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              border: `2px solid ${onboardingData.practicePreference === pref.id ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
              backgroundColor: onboardingData.practicePreference === pref.id ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ fontWeight: 600, color: '#3c4c73', marginBottom: '0.25rem' }}>{pref.label}</div>
            <div style={{ fontSize: '0.9rem', color: '#7e5a75' }}>{pref.description}</div>
          </div>
        ))}
      </div>
      <div style={{ 
        background: 'rgba(126,90,117,0.1)', 
        padding: '1.5rem', 
        borderRadius: '12px',
        textAlign: 'center',
        marginTop: '2rem'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
        <h3 style={{ color: '#3c4c73', marginBottom: '0.5rem' }}>Ready to start!</h3>
        <p style={{ color: '#7e5a75', fontSize: '0.9rem' }}>
          Click "Create Dashboard" to add this language to your learning journey.
        </p>
      </div>
    </div>
  );

  if (availableLanguages.length === 0 && currentStep === 1) {
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
          maxWidth: 500,
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌍</div>
          <h1 style={{ color: '#3c4c73', fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
            All Languages Added!
          </h1>
          <p style={{ color: '#7e5a75', fontSize: '1rem', marginBottom: '2rem' }}>
            You already have dashboards for all available languages. You can edit your existing language settings from the dashboard.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
        maxWidth: 600,
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌍</div>
          <h1 style={{
            color: '#3c4c73',
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            fontFamily: 'Grandstander, Arial, sans-serif'
          }}>
            Add New Language
          </h1>
          <p style={{ color: '#7e5a75', fontSize: '1rem' }}>
            Expand your multilingual journey
          </p>
        </div>

        {renderProgressBar()}

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

        <div style={{ marginBottom: '2rem' }}>
          {(() => {
            switch(currentStep) {
              case 1: return renderStep1();
              case 2: return renderStep2();
              case 3: return renderStep3();
              case 4: return renderStep4();
              default: return <div>Invalid step</div>;
            }
          })()}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 10,
              border: '2px solid rgba(126,90,117,0.3)',
              background: 'transparent',
              color: currentStep === 1 ? '#ccc' : '#7e5a75',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: currentStep === 1 ? 0.5 : 1
            }}
          >
            ← Back
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={availableLanguages.length === 0}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: 10,
                border: 'none',
                background: availableLanguages.length === 0 ? '#ccc' : 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: availableLanguages.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: 10,
                border: 'none',
                background: isLoading ? '#ccc' : 'linear-gradient(135deg, #c38d94 0%, #7e5a75 100%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? 'Creating...' : '🎉 Create Dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LanguageOnboarding; 