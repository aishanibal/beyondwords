/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../ClientLayout';
import axios from 'axios';
import { LANGUAGES, PROFICIENCY_LEVELS, TALK_TOPICS, LEARNING_GOALS, PRACTICE_PREFERENCES, FEEDBACK_LANGUAGES, Language, ProficiencyLevel, Topic, LearningGoal, PracticePreference, FeedbackLanguage } from '../../lib/preferences';
import { createLanguageDashboard } from '../../lib/api';

// Responsive CSS styles for language onboarding
const languageOnboardingStyles = `
  /* Step 3 responsive grids (match main onboarding) */
  .topics-grid, .goals-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6vh;
    margin-bottom: 0.2vh;
    align-items: stretch;
  }
  @media (min-width: 481px) and (max-width: 1024px) {
    .topics-grid, .goals-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.6vh;
    }
  }
  @media (min-width: 1025px) and (max-width: 1439px) {
    .topics-grid, .goals-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 0.6vh;
    }
  }
  @media (min-width: 1440px) {
    .topics-grid, .goals-grid {
      grid-template-columns: repeat(5, 1fr);
      gap: 0.6vh;
    }
  }
  .language-onboarding-step-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
    padding: clamp(1rem, 3vw, 2rem) 0;
    box-sizing: border-box;
  }

  .language-onboarding-title {
    color: var(--blue-secondary);
    font-size: clamp(1.2rem, 3vw, 1.6rem);
    font-weight: 700;
    margin-bottom: clamp(0.1rem, 0.5vw, 0.3rem);
    text-align: center;
    font-family: 'Gabriela', Arial, sans-serif;
    line-height: 1.1;
  }

  .language-onboarding-subtitle {
    color: var(--rose-primary);
    text-align: center;
    margin-bottom: clamp(0.3rem, 0.8vw, 0.5rem);
    font-size: clamp(0.8rem, 1.8vw, 1rem);
    font-family: 'AR One Sans', Arial, sans-serif;
    line-height: 1.2;
    max-width: 90%;
    margin-left: auto;
    margin-right: auto;
  }

  .language-onboarding-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: clamp(0.2rem, 0.5vw, 0.3rem);
    margin-bottom: clamp(0.3rem, 0.8vw, 0.5rem);
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding: clamp(0.1rem, 0.4vw, 0.2rem);
    box-sizing: border-box;
    align-items: stretch;
    height: auto;
    justify-items: center;
    max-height: 50vh;
    overflow: hidden;
  }

  .language-onboarding-card {
    padding: clamp(0.1rem, 0.3vw, 0.2rem);
    border-radius: clamp(0.1rem, 0.4vw, 0.2rem);
    border: 1px solid rgba(126,90,117,0.2);
    background-color: var(--cream);
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    max-width: 90px;
    margin: 0 auto;
    min-height: 0;
    height: calc((50vh - 1.5rem) / 6);
    max-height: calc((50vh - 1.5rem) / 6);
  }

  .language-onboarding-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(126,90,117,0.15);
  }

  .language-onboarding-card.selected {
    border-color: var(--rose-primary);
    background-color: rgba(126,90,117,0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(126,90,117,0.2);
  }

  .language-onboarding-flag {
    font-size: clamp(0.7rem, 1.4vw, 0.9rem);
    margin-bottom: clamp(0.02rem, 0.05vw, 0.03rem);
    line-height: 1;
  }

  .language-onboarding-name {
    font-weight: 600;
    color: var(--blue-secondary);
    margin-bottom: clamp(0.02rem, 0.05vw, 0.03rem);
    font-size: clamp(0.45rem, 0.9vw, 0.55rem);
    font-family: 'Gabriela', Arial, sans-serif;
    line-height: 1;
  }

  .language-onboarding-description {
    font-size: clamp(0.35rem, 0.7vw, 0.45rem);
    color: var(--rose-primary);
    line-height: 1;
    font-family: 'AR One Sans', Arial, sans-serif;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    word-wrap: break-word;
    hyphens: auto;
    text-align: center;
    flex-grow: 1;
  }

  /* Mobile-first responsive breakpoints */
  @media (max-width: 480px) {
    .language-onboarding-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: clamp(0.15rem, 0.4vw, 0.25rem);
      padding: clamp(0.1rem, 0.3vw, 0.15rem);
    }
    
    .language-onboarding-card {
      padding: clamp(0.08rem, 0.25vw, 0.15rem);
      max-width: 85px;
      height: calc((50vh - 1rem) / 11);
      max-height: calc((50vh - 1rem) / 11);
    }
    
    .language-onboarding-flag {
      font-size: clamp(0.6rem, 1.2vw, 0.8rem);
      margin-bottom: clamp(0.01rem, 0.03vw, 0.02rem);
    }
    
    .language-onboarding-name {
      font-size: clamp(0.4rem, 0.8vw, 0.5rem);
      margin-bottom: clamp(0.01rem, 0.03vw, 0.02rem);
    }
    
    .language-onboarding-description {
      font-size: clamp(0.3rem, 0.6vw, 0.4rem);
      -webkit-line-clamp: 1;
    }
  }

  @media (min-width: 481px) and (max-width: 768px) {
    .language-onboarding-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.4rem;
    }
    
    .language-onboarding-card {
      max-width: 100px;
    }
    
    .language-onboarding-flag {
      font-size: 1.1rem;
    }
    
    .language-onboarding-name {
      font-size: 0.65rem;
    }
    
    .language-onboarding-description {
      font-size: 0.5rem;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .language-onboarding-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.7rem;
    }
    
    .language-onboarding-card {
      max-width: 170px;
    }
    
    .language-onboarding-flag {
      font-size: 1.5rem;
    }
    
    .language-onboarding-name {
      font-size: 0.8rem;
    }
    
    .language-onboarding-description {
      font-size: 0.6rem;
    }
  }

  @media (min-width: 1025px) and (max-width: 1439px) {
    .language-onboarding-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: clamp(0.2rem, 0.5vw, 0.4rem);
    }
    
    .language-onboarding-card {
      max-width: 90px;
      height: calc((50vh - 1.5rem) / 6);
      max-height: calc((50vh - 1.5rem) / 6);
    }
    
    .language-onboarding-flag {
      font-size: clamp(0.7rem, 1.4vw, 0.9rem);
    }
    
    .language-onboarding-name {
      font-size: clamp(0.45rem, 0.9vw, 0.55rem);
    }
    
    .language-onboarding-description {
      font-size: clamp(0.35rem, 0.7vw, 0.45rem);
    }
  }

  /* Large screens optimization */
  @media (min-width: 1440px) and (max-width: 1919px) {
    .language-onboarding-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: clamp(0.2rem, 0.5vw, 0.4rem);
      max-width: 100%;
    }
    
    .language-onboarding-card {
      max-width: 90px;
      height: calc((50vh - 1.5rem) / 6);
      max-height: calc((50vh - 1.5rem) / 6);
    }
    
    .language-onboarding-flag {
      font-size: clamp(0.7rem, 1.4vw, 0.9rem);
    }
    
    .language-onboarding-name {
      font-size: clamp(0.45rem, 0.9vw, 0.55rem);
    }
    
    .language-onboarding-description {
      font-size: clamp(0.35rem, 0.7vw, 0.45rem);
    }
  }

  /* Ultra-wide screens */
  @media (min-width: 1920px) {
    .language-onboarding-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: clamp(0.2rem, 0.5vw, 0.4rem);
      max-width: 100%;
    }
    
    .language-onboarding-card {
      max-width: 90px;
      height: calc((50vh - 1.5rem) / 6);
      max-height: calc((50vh - 1.5rem) / 6);
    }
    
    .language-onboarding-flag {
      font-size: clamp(0.7rem, 1.4vw, 0.9rem);
    }
    
    .language-onboarding-name {
      font-size: clamp(0.45rem, 0.9vw, 0.55rem);
    }
    
    .language-onboarding-description {
      font-size: clamp(0.35rem, 0.7vw, 0.45rem);
    }
  }
`;


interface LanguageOnboardingProps {
  onComplete: (dashboard: any) => void;
  existingLanguages?: string[];
}

function LanguageOnboarding({ onComplete, existingLanguages = [] }: LanguageOnboardingProps) {
  const { user } = useUser();
  const router = useRouter();
  
  
  // Authentication check
  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to continue with language onboarding.</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
      case 1: return onboardingData.language !== '' && onboardingData.feedbackLanguage !== '';
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
      case 1: return 'Please select a language to learn and a feedback language.';
      case 2: return 'Please select your proficiency level.';
      case 3: return 'Please select at least one topic to talk about and one learning goal.';
      case 4: return 'Please select your practice preference.';
      default: return 'Please complete this step.';
    }
  };

  const renderFeedbackLanguageSelector = () => (
    <div style={{ marginTop: '1.2vh', marginBottom: '0.5vh' }}>
      <h3 style={{ 
        color: 'var(--blue-secondary)', 
        fontSize: '1.8vh', 
        fontWeight: 600, 
        marginBottom: '0.3vh',
        fontFamily: 'Gabriela, Arial, sans-serif'
      }}>
        Feedback Language
      </h3>
      <p style={{ 
        color: 'var(--rose-primary)', 
        fontSize: '1.4vh', 
        marginBottom: '0.4vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Choose the language in which you want to receive AI feedback and explanations.
      </p>
      <select
        value={onboardingData.feedbackLanguage}
        onChange={e => setOnboardingData(prev => ({ ...prev, feedbackLanguage: e.target.value }))}
        style={{
          width: '100%',
          padding: '0.6vh',
          borderRadius: '0.6vh',
          border: '2px solid var(--rose-accent)',
          fontSize: '1.4vh',
          background: 'var(--cream)',
          color: 'var(--blue-secondary)',
          fontFamily: 'Montserrat, Arial, sans-serif'
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
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { success, data: dashboard } = await createLanguageDashboard({
        user_id: user.id,
        language: onboardingData.language,
        proficiency_level: onboardingData.proficiency,
        talk_topics: onboardingData.talkTopics,
        learning_goals: onboardingData.learningGoals,
        practice_preference: onboardingData.practicePreference,
        feedback_language: onboardingData.feedbackLanguage,
        is_primary: false
      });

      if (!success) {
        throw new Error('Failed to create language dashboard');
      }

      if (onComplete) {
        onComplete(dashboard);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Language onboarding error:', err);
      setError(err.message || 'Failed to create language dashboard. Please try again.');
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ 
          color: 'var(--rose-primary)', 
          fontSize: '0.9rem', 
          fontWeight: 600,
          fontFamily: 'Montserrat, Arial, sans-serif'
        }}>Step {currentStep} of {totalSteps}</span>
        <span style={{ 
          color: 'var(--rose-primary)', 
          fontSize: '0.9rem',
          fontFamily: 'Montserrat, Arial, sans-serif'
        }}>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
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
          backgroundColor: 'var(--rose-primary)',
          borderRadius: '3px',
          transition: 'width 0.3s ease'
        }}></div>
      </div>
    </div>
  );

  const renderStep1 = () => (
      <div className="language-onboarding-step-container">
        <h2 className="language-onboarding-title">
          Which language would you like to add?
        </h2>
        <p className="language-onboarding-subtitle">
          Choose another language you want to practice speaking with AI feedback
        </p>
      {availableLanguages.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: 'var(--rose-primary)', 
          marginBottom: '2rem',
          fontFamily: 'AR One Sans, Arial, sans-serif'
        }}>
          <p>You already have dashboards for all available languages!</p>
          <p>You can edit your existing language settings from the dashboard.</p>
        </div>
      ) : (
        <div className="language-onboarding-grid">
          {availableLanguages.map((lang: Language) => (
            <div
              key={lang.code}
              onClick={() => updateOnboardingData('language', lang.code)}
              className={`language-onboarding-card ${onboardingData.language === lang.code ? 'selected' : ''}`}
            >
              <div className="language-onboarding-flag">{lang.flag}</div>
              <div className="language-onboarding-name">{lang.label}</div>
              <div className="language-onboarding-description">{lang.description}</div>
            </div>
          ))}
        </div>
      )}
      {renderFeedbackLanguageSelector()}
    </div>
  );

  const renderStep2 = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ 
        color: 'var(--blue-secondary)', 
        fontSize: '2.6vh', 
        fontWeight: 700, 
        marginBottom: '0.6vh', 
        textAlign: 'center',
        fontFamily: 'Gabriela, Arial, sans-serif'
      }}>
        What's your current level?
      </h2>
      <p style={{ 
        color: 'var(--rose-primary)', 
        textAlign: 'center', 
        marginBottom: '1.2vh', 
        fontSize: '1.7vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Be honest - this helps us personalize your experience
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.0vh', marginBottom: '0.4vh' }}>
        {PROFICIENCY_LEVELS.map((level: ProficiencyLevel) => (
          <div
            key={level.level}
            onClick={() => updateOnboardingData('proficiency', level.level)}
            style={{
              padding: '1.2vh',
              borderRadius: '0.8vh',
              border: `2px solid ${onboardingData.proficiency === level.level ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
              backgroundColor: onboardingData.proficiency === level.level ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8vh',
              minHeight: '8vh'
            }}
          >
            <div style={{ fontSize: '2.5vh' }}>{level.icon}</div>
            <div>
              <div style={{ 
                fontWeight: 600, 
                color: 'var(--blue-secondary)', 
                marginBottom: '0.2vh',
                fontSize: '1.6vh',
                fontFamily: 'Gabriela, Arial, sans-serif'
              }}>{level.label}</div>
              <div style={{ 
                fontSize: '1.3vh', 
                color: 'var(--rose-primary)',
                fontFamily: 'AR One Sans, Arial, sans-serif'
              }}>{level.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
      <h2 style={{ 
        color: 'var(--blue-secondary)', 
        fontSize: '2.2vh', 
        fontWeight: 700, 
        marginBottom: '0.2vh', 
        textAlign: 'center',
        fontFamily: 'Gabriela, Arial, sans-serif'
      }}>
        What would you like to focus on?
      </h2>
      <p style={{ 
        color: 'var(--rose-primary)', 
        textAlign: 'center', 
        marginBottom: '0.4vh', 
        fontSize: '1.2vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Choose topics you'd like to discuss and skills you want to develop
      </p>
      {/* Talk Topics Section */}
      <div style={{ marginBottom: '0.8vh' }}>
        <h3 style={{ 
          color: 'var(--blue-secondary)', 
          fontSize: '1.8vh', 
          fontWeight: 600, 
          marginBottom: '0.2vh', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.3vh',
          fontFamily: 'Gabriela, Arial, sans-serif'
        }}>
          💬 Topics I'd like to talk about
        </h3>
        <div className="topics-grid">
          {TALK_TOPICS.map((topic: Topic) => (
            <div
              key={topic.id}
              onClick={() => toggleTalkTopic(topic.id)}
              style={{
                padding: '0.7vh',
                borderRadius: '0.4vh',
                border: `2px solid ${onboardingData.talkTopics.includes(topic.id) ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
                backgroundColor: onboardingData.talkTopics.includes(topic.id) ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                marginTop: '0.2vh',
                marginLeft: '0.3vh',
                marginRight: '0.3vh',
                marginBottom: '0.2vh',
                gap: '1.3vh'
              }}
            >
              <div style={{ fontSize: '1.4vh' }}>{topic.icon}</div>
              <div style={{ 
                fontWeight: 500, 
                color: 'var(--blue-secondary)', 
                fontSize: '1.5vh',
                fontFamily: 'Gabriela, Arial, sans-serif'
              }}>{topic.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Learning Goals Section */}
      <div>
        <h3 style={{ 
          color: 'var(--blue-secondary)', 
          fontSize: '1.8vh', 
          fontWeight: 600, 
          marginBottom: '0.2vh', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.3vh',
          fontFamily: 'Gabriela, Arial, sans-serif'
        }}>
          🎯 Skills I want to develop
        </h3>
        <div className="goals-grid">
          {LEARNING_GOALS.map((goal: LearningGoal) => (
            <div
              key={goal.id}
              onClick={() => toggleLearningGoal(goal.id)}
              style={{
                padding: '0.5vh',
                borderRadius: '0.4vh',
                border: `2px solid ${onboardingData.learningGoals.includes(goal.id) ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
                backgroundColor: onboardingData.learningGoals.includes(goal.id) ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3vh',
                marginTop: '0.2vh',
                marginLeft: '0.3vh',
                marginRight: '0.3vh',
                marginBottom: '0.2vh'
              }}
            >
              <div style={{ fontSize: '1.8vh' }}>{goal.icon}</div>
              <div style={{ 
                fontWeight: 500, 
                color: 'var(--blue-secondary)', 
                fontSize: '1.5vh',
                fontFamily: 'Gabriela, Arial, sans-serif'
              }}>{goal.goal}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ 
        color: 'var(--blue-secondary)', 
        fontSize: '2.2vh', 
        fontWeight: 700, 
        marginBottom: '0.3vh', 
        textAlign: 'center',
        fontFamily: 'Gabriela, Arial, sans-serif'
      }}>
        How do you prefer to practice?
      </h2>
      <p style={{ 
        color: 'var(--rose-primary)', 
        textAlign: 'center', 
        marginBottom: '0.8vh', 
        fontSize: '1.4vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Choose what works best for your schedule
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6vh', marginBottom: '0.2vh' }}>
        {PRACTICE_PREFERENCES.map((pref: PracticePreference) => (
          <div
            key={pref.id}
            onClick={() => updateOnboardingData('practicePreference', pref.id)}
            style={{
              padding: '1.2vh',
              borderRadius: '0.8vh',
              border: `2px solid ${onboardingData.practicePreference === pref.id ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
              backgroundColor: onboardingData.practicePreference === pref.id ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ 
              fontWeight: 600, 
              color: 'var(--blue-secondary)', 
              marginBottom: '0.1vh',
              fontSize: '1.8vh',
              fontFamily: 'Gabriela, Arial, sans-serif'
            }}>{pref.label}</div>
            <div style={{ 
              fontSize: '1.3vh', 
              color: 'var(--rose-primary)',
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>{pref.description}</div>
          </div>
        ))}
      </div>
      <div style={{ 
        background: 'rgba(126,90,117,0.1)', 
        padding: '1.5vh', 
        borderRadius: '1.2vh',
        textAlign: 'center',
        marginTop: '0.8vh'
      }}>
        <div style={{ fontSize: '3vh', marginBottom: '0.3vh' }}>🎉</div>
        <h3 style={{ 
          color: 'var(--blue-secondary)', 
          marginBottom: '0.3vh',
          fontSize: '2vh',
          fontFamily: 'Gabriela, Arial, sans-serif'
        }}>You're all set!</h3>
        <p style={{ 
          color: 'var(--rose-primary)', 
          fontSize: '1.4vh',
          fontFamily: 'AR One Sans, Arial, sans-serif'
        }}>
          Click "Complete Setup" to access your personalized dashboard and start your first practice session.
        </p>
      </div>
    </div>
  );

  if (availableLanguages.length === 0 && currentStep === 1) {
    return (
          <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--cream) 0%, #e8e0d8 50%, #d4c8c0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'Montserrat, Arial, sans-serif'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '2.5rem',
        boxShadow: '0 20px 60px rgba(60,76,115,0.15)',
        maxWidth: 500,
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌍</div>
        <h1 style={{ 
          color: 'var(--blue-secondary)', 
          fontSize: '2rem', 
          fontWeight: 700, 
          marginBottom: '1rem',
          fontFamily: 'Gabriela, Arial, sans-serif'
        }}>
          All Languages Added!
        </h1>
        <p style={{ 
          color: 'var(--rose-primary)', 
          fontSize: '1rem', 
          marginBottom: '2rem',
          fontFamily: 'AR One Sans, Arial, sans-serif'
        }}>
          You already have dashboards for all available languages. You can edit your existing language settings from the dashboard.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'Montserrat, Arial, sans-serif'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: languageOnboardingStyles }} />
      <div style={{
        height: 'calc(100vh - 6rem)', // Account for navigation bar (6rem)
        background: 'linear-gradient(135deg, var(--cream) 0%, #e8e0d8 50%, #d4c8c0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5vh',
        fontFamily: 'Montserrat, Arial, sans-serif',
        overflow: 'hidden'
      }}>
      <div style={{
        background: '#fff',
        borderRadius: '1.5vh',
        padding: '2vh',
        boxShadow: '0 2vh 6vh rgba(60,76,115,0.15)',
        maxWidth: '55vw',
        width: '100%',
        height: 'calc(100vh - 6rem - 1vh)', // Account for navigation bar + outer padding
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header - Fixed size */}
        <div style={{ textAlign: 'center', marginBottom: '0.2vh', flexShrink: 0, height: '6vh' }}>
          <div style={{ fontSize: '2.0vh', marginBottom: '0.1vh' }}>🌍</div>
          <h1 style={{
            color: 'var(--blue-secondary)',
            fontSize: '3.5vh',
            fontWeight: 700,
            marginBottom: '0.1vh',
            fontFamily: 'Gabriela, Arial, sans-serif'
          }}>
            Add New Language
          </h1>
          <p style={{ 
            color: 'var(--rose-primary)', 
            fontSize: '1.8vh',
            fontFamily: 'AR One Sans, Arial, sans-serif'
          }}>
            Expand your multilingual journey
          </p>
        </div>

        {/* Progress Bar - Fixed size */}
        <div style={{ marginTop: '3.5vh', marginBottom: '0.4vh', flexShrink: 0, height: '2vh' }}>
          {renderProgressBar()}
        </div>

        {/* Error message - Fixed size when present */}
        {error && (
          <div style={{
            background: 'rgba(220,53,69,0.1)',
            color: '#dc3545',
            padding: '0.6vh',
            borderRadius: '0.6vh',
            marginTop: '2.4vh',
            marginBottom: '0.4vh',
            border: '1px solid rgba(220,53,69,0.2)',
            textAlign: 'center',
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontSize: '1.4vh',
            flexShrink: 0,
            height: '3vh'
          }}>
            {error}
          </div>
        )}

        {/* Step Content - Takes remaining space */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginBottom: '0.2vh',
          minHeight: 0,
          overflow: 'hidden',
          maxWidth: '80%',
          margin: '0 auto'
        }}>
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

        {/* Navigation - Fixed at bottom */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexShrink: 0,
          paddingTop: '0.2vh',
          borderTop: '1px solid rgba(126,90,117,0.1)',
          height: '4vh',
          minHeight: '4vh'
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            style={{
              padding: '0.6vh 1.5vh',
              borderRadius: '0.8vh',
              border: '2px solid rgba(126,90,117,0.3)',
              background: 'transparent',
              color: currentStep === 1 ? '#ccc' : 'var(--rose-primary)',
              fontSize: '1.4vh',
              fontWeight: 600,
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: currentStep === 1 ? 0.5 : 1,
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}
          >
            ← Back
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={availableLanguages.length === 0}
              style={{
                padding: '0.6vh 2vh',
                borderRadius: '0.8vh',
                border: 'none',
                background: availableLanguages.length === 0 ? '#ccc' : 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                color: '#fff',
                fontSize: '1.4vh',
                fontWeight: 600,
                cursor: availableLanguages.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Montserrat, Arial, sans-serif'
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                padding: '0.6vh 2vh',
                borderRadius: 10,
                border: 'none',
                background: isLoading ? '#ccc' : 'linear-gradient(135deg, var(--rose-accent) 0%, var(--rose-primary) 100%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Montserrat, Arial, sans-serif'
              }}
            >
              {isLoading ? 'Creating...' : '🎉 Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default LanguageOnboarding; 