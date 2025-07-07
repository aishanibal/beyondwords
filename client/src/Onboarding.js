import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './App';
import axios from 'axios';

const LANGUAGES = [
  { code: 'es', label: 'Spanish', flag: '🇪🇸', description: 'Practice español with AI feedback' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳', description: 'Learn हिंदी pronunciation and conversation' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵', description: 'Master 日本語 speaking skills' },
  { code: 'tl', label: 'Tagalog', flag: '🇵🇭', description: 'Connect with Filipino heritage' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳', description: 'Explore தமிழ் language and culture' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦', description: 'Practice العربية conversation' },
  { code: 'zh', label: 'Mandarin', flag: '🇨🇳', description: 'Learn 中文 pronunciation' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷', description: 'Master 한국어 speaking' },
];

const PROFICIENCY_LEVELS = [
  { 
    level: 'absolute-beginner', 
    label: 'Absolute Beginner',
    description: 'I know very few words or phrases',
    icon: '🌱'
  },
  { 
    level: 'beginner', 
    label: 'Beginner',
    description: 'I can say basic phrases but struggle with conversation',
    icon: '🌿'
  },
  { 
    level: 'intermediate', 
    label: 'Intermediate',
    description: 'I understand well but need practice speaking',
    icon: '🌳'
  },
  { 
    level: 'advanced', 
    label: 'Advanced',
    description: 'I can hold conversations but want to improve fluency',
    icon: '🏔️'
  },
  { 
    level: 'heritage', 
    label: 'Heritage Speaker',
    description: 'I grew up hearing it but want to speak more confidently',
    icon: '🗝️'
  }
];

const LEARNING_GOALS = [
  { id: 'family', label: 'Talk with family members', icon: '👨‍👩‍👧‍👦' },
  { id: 'travel', label: 'Travel and communicate abroad', icon: '✈️' },
  { id: 'heritage', label: 'Connect with my cultural heritage', icon: '🏛️' },
  { id: 'business', label: 'Professional/business communication', icon: '💼' },
  { id: 'media', label: 'Understand movies, music, and media', icon: '🎬' },
  { id: 'confidence', label: 'Build speaking confidence', icon: '💪' },
  { id: 'pronunciation', label: 'Improve pronunciation and accent', icon: '🗣️' },
  { id: 'fluency', label: 'Achieve conversational fluency', icon: '💬' }
];

const PRACTICE_PREFERENCES = [
  { id: 'daily-short', label: '5-10 minutes daily', description: 'Quick daily practice sessions' },
  { id: 'few-times-week', label: '15-30 minutes, few times a week', description: 'Regular focused sessions' },
  { id: 'intensive-weekend', label: 'Longer sessions on weekends', description: 'Deep practice when you have time' },
  { id: 'flexible', label: 'Flexible - when I have time', description: 'Practice as your schedule allows' }
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

function Onboarding() {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    language: '',
    proficiency: '',
    goals: [],
    practicePreference: '',
    motivation: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const totalSteps = 5;

  const updateOnboardingData = (field, value) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGoal = (goalId) => {
    setOnboardingData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(id => id !== goalId)
        : [...prev.goals, goalId]
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
      case 3: return onboardingData.goals.length > 0;
      case 4: return onboardingData.practicePreference !== '';
      case 5: return onboardingData.motivation.trim() !== '';
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
      case 3: return 'Please select at least one learning goal.';
      case 4: return 'Please select your practice preference.';
      case 5: return 'Please share what motivates you to learn.';
      default: return 'Please complete this step.';
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      setError(getStepError());
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await API.post('/api/user/onboarding', {
        language: onboardingData.language,
        proficiency: onboardingData.proficiency,
        goals: onboardingData.goals,
        practicePreference: onboardingData.practicePreference,
        motivation: onboardingData.motivation
      });
      setUser(response.data.user);
      navigate('/dashboard');
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
        {LANGUAGES.map(lang => (
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
        {PROFICIENCY_LEVELS.map(level => (
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
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 style={{ color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
        What are your learning goals?
      </h2>
      <p style={{ color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }}>
        Select all that apply - we'll tailor your practice sessions
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {LEARNING_GOALS.map(goal => (
          <div
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              border: `2px solid ${onboardingData.goals.includes(goal.id) ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
              backgroundColor: onboardingData.goals.includes(goal.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>{goal.icon}</div>
            <div style={{ fontWeight: 600, color: '#3c4c73' }}>{goal.label}</div>
          </div>
        ))}
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
        {PRACTICE_PREFERENCES.map(pref => (
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
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h2 style={{ color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
        What motivates you to learn?
      </h2>
      <p style={{ color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }}>
        Share your personal reason - this helps us create meaningful practice sessions
      </p>
      <textarea
        value={onboardingData.motivation}
        onChange={(e) => updateOnboardingData('motivation', e.target.value)}
        placeholder="For example: I want to speak with my grandmother in her native language, or I'm planning to visit my family's homeland..."
        style={{
          width: '100%',
          minHeight: '120px',
          padding: '1rem',
          borderRadius: '12px',
          border: '2px solid rgba(126,90,117,0.2)',
          backgroundColor: '#f8f6f4',
          fontSize: '1rem',
          fontFamily: 'inherit',
          resize: 'vertical',
          boxSizing: 'border-box',
          marginBottom: '2rem'
        }}
      />
      <div style={{ 
        background: 'rgba(126,90,117,0.1)', 
        padding: '1.5rem', 
        borderRadius: '12px',
        textAlign: 'center'
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
                case 5: return renderStep5();
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
              {isLoading ? 'Setting up...' : '🎉 Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Onboarding; 