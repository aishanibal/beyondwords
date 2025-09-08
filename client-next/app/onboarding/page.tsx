/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../ClientLayout';

import LoadingScreen from '../components/LoadingScreen';
import { LANGUAGES, PROFICIENCY_LEVELS, TALK_TOPICS, LEARNING_GOALS, PRACTICE_PREFERENCES, FEEDBACK_LANGUAGES, Language, ProficiencyLevel, Topic, LearningGoal, PracticePreference, FeedbackLanguage } from '../../lib/preferences';

// Responsive CSS styles for onboarding
const onboardingStyles = `
  .onboarding-step-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
    padding: clamp(0.5rem, 1.5vw, 1rem) 0;
    box-sizing: border-box;
  }

  .onboarding-title {
    color: var(--blue-secondary);
    font-size: 2.3vh;
    font-weight: 700;
    margin-bottom: clamp(0.1rem, 0.5vw, 0.3rem);
    text-align: center;
    font-family: 'Gabriela', Arial, sans-serif;
    line-height: 1.1;
  }

  .onboarding-subtitle {
    color: var(--rose-primary);
    text-align: center;
    margin-bottom: clamp(0.3rem, 0.8vw, 0.5rem);
    font-size: 1.6vh;
    font-family: 'AR One Sans', Arial, sans-serif;
    line-height: 1.2;
    max-width: 90%;
    margin-left: auto;
    margin-right: auto;
  }

  .language-grid {
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

  .language-card {
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

  .language-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(126,90,117,0.15);
  }

  .language-card.selected {
    border-color: var(--rose-primary);
    background-color: rgba(126,90,117,0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(126,90,117,0.2);
  }

  .language-flag {
    font-size: clamp(0.7rem, 1.4vw, 0.9rem);
    margin-bottom: clamp(0.02rem, 0.05vw, 0.03rem);
    line-height: 1;
  }

  .language-name {
    font-weight: 600;
    color: var(--blue-secondary);
    margin-bottom: clamp(0.02rem, 0.05vw, 0.03rem);
    font-size: clamp(0.45rem, 0.9vw, 0.55rem);
    font-family: 'Gabriela', Arial, sans-serif;
    line-height: 1;
  }

  .language-description {
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

  /* Step 3 responsive grids */
  .topics-grid, .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(140px, 22vw, 240px), 1fr));
    gap: clamp(0.4vh, 1vw, 1.2vh);
    margin-bottom: 0.2vh;
    align-items: stretch;
  }

  @media (max-width: 480px) {
    .topics-grid, .goals-grid {
      grid-template-columns: repeat(auto-fit, minmax(clamp(130px, 44vw, 200px), 1fr));
      gap: clamp(0.3vh, 1.6vw, 0.8vh);
    }
  }

  @media (min-width: 1440px) {
    .topics-grid, .goals-grid {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
  }

  /* Mobile-first responsive breakpoints */
  @media (max-width: 480px) {
    .language-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: clamp(0.15rem, 0.4vw, 0.25rem);
      padding: clamp(0.1rem, 0.3vw, 0.15rem);
    }
    
    .language-card {
      padding: clamp(0.08rem, 0.25vw, 0.15rem);
      max-width: 85px;
      height: calc((50vh - 1rem) / 11);
      max-height: calc((50vh - 1rem) / 11);
    }
    
    .language-flag {
      font-size: clamp(0.6rem, 1.2vw, 0.8rem);
      margin-bottom: clamp(0.01rem, 0.03vw, 0.02rem);
    }
    
    .language-name {
      font-size: clamp(0.4rem, 0.8vw, 0.5rem);
      margin-bottom: clamp(0.01rem, 0.03vw, 0.02rem);
    }
    
    .language-description {
      font-size: clamp(0.3rem, 0.6vw, 0.4rem);
      -webkit-line-clamp: 1;
    }
  }

  @media (min-width: 481px) and (max-width: 768px) {
    .language-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.4rem;
    }
    
    .language-card {
      max-width: 100px;
    }
    
    .language-flag {
      font-size: 1.1rem;
    }
    
    .language-name {
      font-size: 0.65rem;
    }
    
    .language-description {
      font-size: 0.5rem;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .language-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 0.7rem;
    }
    
    .language-card {
      max-width: 100px;
    }
    
    .language-flag {
      font-size: 1.5rem;
    }
    
    .language-name {
      font-size: 0.8rem;
    }
    
    .language-description {
      font-size: 0.6rem;
    }
  }

  @media (min-width: 1025px) and (max-width: 1439px) {
    .language-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: clamp(0.2rem, 0.5vw, 0.4rem);
    }
    
    .language-card {
      max-width: 90px;
      height: calc((50vh - 1.5rem) / 6);
      max-height: calc((50vh - 1.5rem) / 6);
    }
    
    .language-flag {
      font-size: clamp(0.7rem, 1.4vw, 0.9rem);
    }
    
    .language-name {
      font-size: clamp(0.45rem, 0.9vw, 0.55rem);
    }
    
    .language-description {
      font-size: clamp(0.35rem, 0.7vw, 0.45rem);
    }
  }

  /* Large screens optimization */
  @media (min-width: 1440px) and (max-width: 1919px) {
    .language-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: clamp(0.2rem, 0.5vw, 0.4rem);
      max-width: 100%;
    }
    
    .language-card {
      max-width: 90px;
      height: calc((50vh - 1.5rem) / 6);
      max-height: calc((50vh - 1.5rem) / 6);
    }
    
    .language-flag {
      font-size: clamp(0.7rem, 1.4vw, 0.9rem);
    }
    
    .language-name {
      font-size: clamp(0.45rem, 0.9vw, 0.55rem);
    }
    
    .language-description {
      font-size: clamp(0.35rem, 0.7vw, 0.45rem);
    }
  }

  /* Ultra-wide screens */
  @media (min-width: 1920px) {
    .language-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: clamp(0.2rem, 0.5vw, 0.4rem);
      max-width: 100%;
    }
    
    .language-card {
      max-width: 90px;
      height: calc((50vh - 1.5rem) / 6);
      max-height: calc((50vh - 1.5rem) / 6);
    }
    
    .language-flag {
      font-size: clamp(0.7rem, 1.4vw, 0.9rem);
    }
    
    .language-name {
      font-size: clamp(0.45rem, 0.9vw, 0.55rem);
    }
    
    .language-description {
      font-size: clamp(0.35rem, 0.7vw, 0.45rem);
    }
  }
`;

export default function OnboardingPage() {
  const { user, setUser } = useUser();
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
  const [userIdError, setUserIdError] = useState('');

  React.useEffect(() => {
    if (user && !user.id) {
      setUserIdError('User ID is missing. Please try reloading the page or logging in again.');
    } else {
      setUserIdError('');
    }
    }, [user]);

  if (user === null) {
    return <LoadingScreen message="Loading your experience..." />;
  }

  const totalSteps = 4;

  const updateOnboardingData = (field: keyof OnboardingData, value: string | string[]) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTalkTopic = (topicId: string) => {
    setOnboardingData(prev => ({
      ...prev,
      talkTopics: prev.talkTopics.includes(topicId)
        ? prev.talkTopics.filter(id => id !== topicId)
        : [...prev.talkTopics, topicId]
    }));
  };

  const toggleLearningGoal = (goalId: string) => {
    setOnboardingData(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(goalId)
        ? prev.learningGoals.filter(id => id !== goalId)
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
      case 1: return 'Please select a language to learn and choose your feedback language preference.';
      case 2: return 'Please select your proficiency level.';
      case 3: return 'Please select at least one topic to talk about and one learning goal.';
      case 4: return 'Please select your practice preference.';
      default: return 'Please complete this step.';
    }
  };

  const renderFeedbackLanguageSelector = () => (
    <div style={{ marginBottom: '0.4vh' }}>
      <h3 style={{ 
        color: 'var(--blue-secondary)', 
        fontSize: '2.3vh', 
        fontWeight: 600, 
        marginBottom: '0.2vh',
        marginTop: '2.2vh',
        fontFamily: 'Gabriela, Arial, sans-serif'
      }}>
        Feedback Language
      </h3>
      <p style={{ 
        color: 'var(--rose-primary)', 
        fontSize: '1.6vh', 
        marginBottom: '0.2vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Choose the language in which you want to receive AI feedback and explanations.
      </p>
      <select
        value={onboardingData.feedbackLanguage}
        onChange={e => setOnboardingData(prev => ({ ...prev, feedbackLanguage: e.target.value }))}
        style={{
          width: '100%',
          padding: '1.0vh',
          borderRadius: '0.6vh',
          border: '2px solid var(--rose-accent)',
          fontSize: '1.4vh',
          background: 'var(--cream)',
          color: 'var(--blue-secondary)',
          marginBottom: '0.2vh',
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
      // Get current user from context
      const currentUser = user;
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      // Create language dashboard using Express server API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beyondwords-express.onrender.com'}/api/user/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') ? JSON.parse(localStorage.getItem('supabase.auth.token')!).access_token : ''}`
        },
        body: JSON.stringify({
          language: onboardingData.language,
          proficiency: onboardingData.proficiency,
          talkTopics: onboardingData.talkTopics,
          learningGoals: onboardingData.learningGoals,
          practicePreference: onboardingData.practicePreference
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create language dashboard');
      }

      const result = await response.json();
      console.log('[ONBOARDING] Server response:', result);

      // Update local user state
      setUser({
        ...currentUser,
        onboarding_complete: true
      });

      // Persist selected language for dashboard auto-selection
      localStorage.setItem('selectedLanguage', onboardingData.language);
      
      // Set loading to false before navigation
      setIsLoading(false);
      
      console.log('[ONBOARDING] Completed successfully, navigating to dashboard');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to save onboarding. Please try again.');
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div style={{ marginBottom: '0.3vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3vh' }}>
        <span style={{ 
          color: 'var(--rose-primary)', 
          fontSize: '1.8vh', 
          fontWeight: 600,
          fontFamily: 'Montserrat, Arial, sans-serif'
        }}>Step {currentStep} of {totalSteps}</span>
        <span style={{ 
          color: 'var(--rose-primary)', 
          fontSize: '1.8vh',
          fontFamily: 'Montserrat, Arial, sans-serif'
        }}>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: '0.6vh', 
        backgroundColor: 'rgba(126,90,117,0.2)', 
        borderRadius: '0.3vh',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(currentStep / totalSteps) * 100}%`,
          height: '100%',
          backgroundColor: 'var(--rose-primary)',
          borderRadius: '0.3vh',
          transition: 'width 0.3s ease'
        }}></div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="onboarding-step-container">
      <h2 className="onboarding-title">
        Which language would you like to learn?
      </h2>
      <p className="onboarding-subtitle">
        Choose the language you want to practice speaking with AI feedback
      </p>
      <div className="language-grid">
        {LANGUAGES.map((lang: Language) => (
          <div
            key={lang.code}
            onClick={() => updateOnboardingData('language', lang.code)}
            className={`language-card ${onboardingData.language === lang.code ? 'selected' : ''}`}
          >
            <div className="language-flag">{lang.flag}</div>
            <div className="language-name">{lang.label}</div>
            <div className="language-description">{lang.description}</div>
          </div>
        ))}
      </div>
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
              padding: '1.6vh',
              borderRadius: '0.8vh',
              border: `2px solid ${onboardingData.proficiency === level.level ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
              backgroundColor: onboardingData.proficiency === level.level ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '1.0vh'
            }}
          >
            <div style={{ fontSize: '2.5vh' }}>{level.icon}</div>
            <div>
              <div style={{ 
                fontWeight: 600, 
                color: 'var(--blue-secondary)', 
                marginBottom: '0.1vh',
                fontSize: '2.0vh',
                fontFamily: 'Gabriela, Arial, sans-serif'
              }}>{level.label}</div>
              <div style={{ 
                fontSize: '1.5vh', 
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: onboardingStyles }} />
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
          <div style={{ fontSize: '2.0vh', marginBottom: '0.1vh' }}>🗝️</div>
          <h1 style={{
            color: 'var(--blue-secondary)',
            fontSize: '3.5vh',
            fontWeight: 700,
            marginBottom: '0.1vh',
            fontFamily: 'Gabriela, Arial, sans-serif'
          }}>
            Welcome to BeyondWords!
          </h1>
          <p style={{ 
            color: 'var(--rose-primary)', 
            fontSize: '1.8vh',
            fontFamily: 'AR One Sans, Arial, sans-serif'
          }}>
            Let's personalize your language learning journey
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
            try {
              switch(currentStep) {
                case 1: return renderStep1();
                case 2: return renderStep2();
                case 3: return renderStep3();
                case 4: return renderStep4();
                default: return <div>Invalid step</div>;
              }
            } catch (err) {
              console.error('Error rendering step:', err);
              return <div style={{ color: '#dc3545' }}>Error loading step content. Please refresh.</div>;
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
              style={{
                padding: '0.6vh 2vh',
                borderRadius: '0.8vh',
                border: 'none',
                background: 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                color: '#fff',
                fontSize: '1.4vh',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Montserrat, Arial, sans-serif'
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !user || !user.id}
              style={{
                padding: '0.6vh 2vh',
                borderRadius: '0.8vh',
                border: 'none',
                background: isLoading || !user || !user.id ? '#ccc' : 'linear-gradient(135deg, var(--rose-accent) 0%, var(--rose-primary) 100%)',
                color: '#fff',
                fontSize: '1.4vh',
                fontWeight: 600,
                cursor: isLoading || !user || !user.id ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Montserrat, Arial, sans-serif'
              }}
            >
              {isLoading ? 'Setting up...' : '🎉 Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}