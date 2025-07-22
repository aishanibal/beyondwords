// TODO: This file should be split into Next.js pages and components.
import React, { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './_app';
import axios from 'axios';
import { LANGUAGES, PROFICIENCY_LEVELS, TALK_TOPICS, LEARNING_GOALS, PRACTICE_PREFERENCES, FEEDBACK_LANGUAGES, Language, ProficiencyLevel, Topic, LearningGoal, PracticePreference, FeedbackLanguage } from '../lib/preferences';


function Onboarding() {
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
  
  // Robust userId check
  React.useEffect(() => {
    if (user && !user.id) {
      setUserIdError('User ID is missing. Please try reloading the page or logging in again.');
    } else {
      setUserIdError('');
    }
  }, [user]);

  // If user is not loaded yet, show loading spinner/message
  if (user === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f1ec', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗝️</div>
        <div style={{ fontSize: '1.5rem', color: '#7e5a75', fontWeight: 600 }}>BeyondWords</div>
        <div style={{ fontSize: '0.9rem', color: '#7e5a75', opacity: 0.7 }}>Loading your experience...</div>
      </div>
    );
  }
  // If user exists but user.id is missing, allow onboarding (backend now always creates user)
  // If user exists and onboarding is complete, redirect to dashboard (handled in _app.tsx)
  
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
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to save onboarding. Please try again.');
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
        Which language would you like to learn?
      </h2>
      <p style={{ color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }}>
        Choose the language you want to practice speaking with AI feedback
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {LANGUAGES.map((lang: Language) => (
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
      
      {/* Talk Topics Section */}
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

      {/* Learning Goals Section */}
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
        <h3 style={{ color: '#3c4c73', marginBottom: '0.5rem' }}>You're all set!</h3>
        <p style={{ color: '#7e5a75', fontSize: '0.9rem' }}>
          Click "Complete Setup" to access your personalized dashboard and start your first practice session.
        </p>
      </div>
    </div>
  );


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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🗝️</div>
          <h1 style={{
            color: '#3c4c73',
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            fontFamily: 'Grandstander, Arial, sans-serif'
          }}>
            Welcome to BeyondWords!
          </h1>
          <p style={{ color: '#7e5a75', fontSize: '1rem' }}>
            Let's personalize your language learning journey
          </p>
        </div>

        {renderProgressBar()}

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

        {/* Step Content */}
        <div style={{ marginBottom: '2rem' }}>
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

        {/* Navigation */}
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
              style={{
                padding: '0.75rem 2rem',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !user || !user.id}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: 10,
                border: 'none',
                background: isLoading || !user || !user.id ? '#ccc' : 'linear-gradient(135deg, #c38d94 0%, #7e5a75 100%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isLoading || !user || !user.id ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
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

export default Onboarding; 