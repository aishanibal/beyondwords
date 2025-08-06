/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../ClientLayout';
import axios from 'axios';
import LoadingScreen from '../components/LoadingScreen';
import { LANGUAGES, PROFICIENCY_LEVELS, TALK_TOPICS, LEARNING_GOALS, PRACTICE_PREFERENCES, FEEDBACK_LANGUAGES, Language, ProficiencyLevel, Topic, LearningGoal, PracticePreference, FeedbackLanguage } from '../../lib/preferences';

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
    <div style={{ marginBottom: '1.5vh' }}>
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
        fontSize: '1.2vh', 
        marginBottom: '0.3vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Choose the language in which you want to receive AI feedback and explanations.
      </p>
      <select
        value={onboardingData.feedbackLanguage}
        onChange={e => setOnboardingData(prev => ({ ...prev, feedbackLanguage: e.target.value }))}
        style={{
          width: '100%',
          padding: '0.8vh',
          borderRadius: '0.8vh',
          border: '2px solid var(--rose-accent)',
          fontSize: '1.4vh',
          background: 'var(--cream)',
          color: 'var(--blue-secondary)',
          marginBottom: '0.8vh',
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
      const token = localStorage.getItem('jwt');
      const response = await axios.post('/api/user/onboarding', {
        language: onboardingData.language,
        proficiency: onboardingData.proficiency,
        talkTopics: onboardingData.talkTopics,
        learningGoals: onboardingData.learningGoals,
        practicePreference: onboardingData.practicePreference,
        feedbackLanguage: onboardingData.feedbackLanguage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      // Persist selected language for dashboard auto-selection
      localStorage.setItem('selectedLanguage', onboardingData.language);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to save onboarding. Please try again.');
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div style={{ marginBottom: '2vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5vh' }}>
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
        height: '0.8vh', 
        backgroundColor: 'rgba(126,90,117,0.2)', 
        borderRadius: '0.4vh',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${(currentStep / totalSteps) * 100}%`,
          height: '100%',
          backgroundColor: 'var(--rose-primary)',
          borderRadius: '0.4vh',
          transition: 'width 0.3s ease'
        }}></div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
      <h2 style={{ 
        color: 'var(--blue-secondary)', 
        fontSize: '2.5vh', 
        fontWeight: 700, 
        marginBottom: '0.8vh', 
        textAlign: 'center',
        fontFamily: 'Gabriela, Arial, sans-serif'
      }}>
        Which language would you like to learn?
      </h2>
      <p style={{ 
        color: 'var(--rose-primary)', 
        textAlign: 'center', 
        marginBottom: '1.5vh', 
        fontSize: '1.6vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Choose the language you want to practice speaking with AI feedback
      </p>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(18vw, 1fr))', 
        gap: '0.8vh', 
        marginBottom: '1.5vh',
        maxWidth: '100%'
      }}>
        {LANGUAGES.map((lang: Language) => (
          <div
            key={lang.code}
            onClick={() => updateOnboardingData('language', lang.code)}
            style={{
              padding: '1.2vh',
              borderRadius: '1.2vh',
              border: `2px solid ${onboardingData.language === lang.code ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
              backgroundColor: onboardingData.language === lang.code ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              minHeight: '10vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '2.5vh', marginBottom: '0.3vh' }}>{lang.flag}</div>
            <div style={{ 
              fontWeight: 600, 
              color: 'var(--blue-secondary)', 
              marginBottom: '0.2vh', 
              fontSize: '1.6vh',
              fontFamily: 'Gabriela, Arial, sans-serif'
            }}>{lang.label}</div>
            <div style={{ 
              fontSize: '1.2vh', 
              color: 'var(--rose-primary)', 
              lineHeight: '1.2',
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>{lang.description}</div>
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
        fontSize: '3vh', 
        fontWeight: 700, 
        marginBottom: '1vh', 
        textAlign: 'center',
        fontFamily: 'Gabriela, Arial, sans-serif'
      }}>
        What's your current level?
      </h2>
      <p style={{ 
        color: 'var(--rose-primary)', 
        textAlign: 'center', 
        marginBottom: '2vh', 
        fontSize: '2vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Be honest - this helps us personalize your experience
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1vh', marginBottom: '2vh' }}>
        {PROFICIENCY_LEVELS.map((level: ProficiencyLevel) => (
          <div
            key={level.level}
            onClick={() => updateOnboardingData('proficiency', level.level)}
            style={{
              padding: '2vh',
              borderRadius: '2vh',
              border: `2px solid ${onboardingData.proficiency === level.level ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
              backgroundColor: onboardingData.proficiency === level.level ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '2vh'
            }}
          >
            <div style={{ fontSize: '4vh' }}>{level.icon}</div>
            <div>
              <div style={{ 
                fontWeight: 600, 
                color: 'var(--blue-secondary)', 
                marginBottom: '0.5vh',
                fontSize: '2.2vh',
                fontFamily: 'Gabriela, Arial, sans-serif'
              }}>{level.label}</div>
              <div style={{ 
                fontSize: '1.8vh', 
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ 
        color: 'var(--blue-secondary)', 
        fontSize: '3vh', 
        fontWeight: 700, 
        marginBottom: '1vh', 
        textAlign: 'center',
        fontFamily: 'Gabriela, Arial, sans-serif'
      }}>
        What would you like to focus on?
      </h2>
      <p style={{ 
        color: 'var(--rose-primary)', 
        textAlign: 'center', 
        marginBottom: '2vh', 
        fontSize: '2vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Choose topics you'd like to discuss and skills you want to develop
      </p>
      {/* Talk Topics Section */}
      <div style={{ marginBottom: '3vh' }}>
        <h3 style={{ 
          color: 'var(--blue-secondary)', 
          fontSize: '2.5vh', 
          fontWeight: 600, 
          marginBottom: '1vh', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1vh',
          fontFamily: 'Gabriela, Arial, sans-serif'
        }}>
          💬 Topics I'd like to talk about
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(25vw, 1fr))', gap: '1vh', marginBottom: '1vh' }}>
          {TALK_TOPICS.map((topic: Topic) => (
            <div
              key={topic.id}
              onClick={() => toggleTalkTopic(topic.id)}
              style={{
                padding: '1.5vh',
                borderRadius: '1.5vh',
                border: `2px solid ${onboardingData.talkTopics.includes(topic.id) ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
                backgroundColor: onboardingData.talkTopics.includes(topic.id) ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '1vh'
              }}
            >
              <div style={{ fontSize: '2.5vh' }}>{topic.icon}</div>
              <div style={{ 
                fontWeight: 500, 
                color: 'var(--blue-secondary)', 
                fontSize: '1.8vh',
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
          fontSize: '2.5vh', 
          fontWeight: 600, 
          marginBottom: '1vh', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1vh',
          fontFamily: 'Gabriela, Arial, sans-serif'
        }}>
          🎯 Skills I want to develop
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(25vw, 1fr))', gap: '1vh' }}>
          {LEARNING_GOALS.map((goal: LearningGoal) => (
            <div
              key={goal.id}
              onClick={() => toggleLearningGoal(goal.id)}
              style={{
                padding: '1.5vh',
                borderRadius: '1.5vh',
                border: `2px solid ${onboardingData.learningGoals.includes(goal.id) ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
                backgroundColor: onboardingData.learningGoals.includes(goal.id) ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '1vh'
              }}
            >
              <div style={{ fontSize: '2.5vh' }}>{goal.icon}</div>
              <div style={{ 
                fontWeight: 500, 
                color: 'var(--blue-secondary)', 
                fontSize: '1.8vh',
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
        fontSize: '3vh', 
        fontWeight: 700, 
        marginBottom: '1vh', 
        textAlign: 'center',
        fontFamily: 'Gabriela, Arial, sans-serif'
      }}>
        How do you prefer to practice?
      </h2>
      <p style={{ 
        color: 'var(--rose-primary)', 
        textAlign: 'center', 
        marginBottom: '2vh', 
        fontSize: '2vh',
        fontFamily: 'AR One Sans, Arial, sans-serif'
      }}>
        Choose what works best for your schedule
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1vh', marginBottom: '2vh' }}>
        {PRACTICE_PREFERENCES.map((pref: PracticePreference) => (
          <div
            key={pref.id}
            onClick={() => updateOnboardingData('practicePreference', pref.id)}
            style={{
              padding: '2vh',
              borderRadius: '2vh',
              border: `2px solid ${onboardingData.practicePreference === pref.id ? 'var(--rose-primary)' : 'rgba(126,90,117,0.2)'}`,
              backgroundColor: onboardingData.practicePreference === pref.id ? 'rgba(126,90,117,0.1)' : 'var(--cream)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ 
              fontWeight: 600, 
              color: 'var(--blue-secondary)', 
              marginBottom: '0.5vh',
              fontSize: '2.2vh',
              fontFamily: 'Gabriela, Arial, sans-serif'
            }}>{pref.label}</div>
            <div style={{ 
              fontSize: '1.8vh', 
              color: 'var(--rose-primary)',
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>{pref.description}</div>
          </div>
        ))}
      </div>
      <div style={{ 
        background: 'rgba(126,90,117,0.1)', 
        padding: '2vh', 
        borderRadius: '2vh',
        textAlign: 'center',
        marginTop: '2vh'
      }}>
        <div style={{ fontSize: '4vh', marginBottom: '0.5vh' }}>🎉</div>
        <h3 style={{ 
          color: 'var(--blue-secondary)', 
          marginBottom: '0.5vh',
          fontSize: '2.5vh',
          fontFamily: 'Gabriela, Arial, sans-serif'
        }}>You're all set!</h3>
        <p style={{ 
          color: 'var(--rose-primary)', 
          fontSize: '1.8vh',
          fontFamily: 'AR One Sans, Arial, sans-serif'
        }}>
          Click "Complete Setup" to access your personalized dashboard and start your first practice session.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, var(--cream) 0%, #e8e0d8 50%, #d4c8c0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1vh',
      fontFamily: 'Montserrat, Arial, sans-serif',
      overflow: 'hidden'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '2vh',
        padding: '3vh',
        boxShadow: '0 2vh 6vh rgba(60,76,115,0.15)',
        maxWidth: '90vw',
        width: '100%',
        height: '94vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2vh', flexShrink: 0 }}>
          <div style={{ fontSize: '3vh', marginBottom: '0.5vh' }}>🗝️</div>
          <h1 style={{
            color: 'var(--blue-secondary)',
            fontSize: '3vh',
            fontWeight: 700,
            marginBottom: '0.5vh',
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

        {renderProgressBar()}

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(220,53,69,0.1)',
            color: '#dc3545',
            padding: '1vh',
            borderRadius: '1vh',
            marginBottom: '2vh',
            border: '1px solid rgba(220,53,69,0.2)',
            textAlign: 'center',
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontSize: '1.6vh',
            flexShrink: 0
          }}>
            {error}
          </div>
        )}

        {/* Step Content - Dynamic sizing */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          marginBottom: '2vh',
          minHeight: 0,
          overflow: 'hidden'
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
          paddingTop: '2vh',
          borderTop: '1px solid rgba(126,90,117,0.1)',
          minHeight: '8vh'
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            style={{
              padding: '1.5vh 3vh',
              borderRadius: '1.5vh',
              border: '2px solid rgba(126,90,117,0.3)',
              background: 'transparent',
              color: currentStep === 1 ? '#ccc' : 'var(--rose-primary)',
              fontSize: '2vh',
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
                padding: '1.5vh 4vh',
                borderRadius: '1.5vh',
                border: 'none',
                background: 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                color: '#fff',
                fontSize: '2vh',
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
                padding: '1.5vh 4vh',
                borderRadius: '1.5vh',
                border: 'none',
                background: isLoading || !user || !user.id ? '#ccc' : 'linear-gradient(135deg, var(--rose-accent) 0%, var(--rose-primary) 100%)',
                color: '#fff',
                fontSize: '2vh',
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
  );
} 