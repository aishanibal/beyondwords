var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './App';
import axios from 'axios';
import { LANGUAGES, PROFICIENCY_LEVELS, TALK_TOPICS, LEARNING_GOALS, PRACTICE_PREFERENCES, FEEDBACK_LANGUAGES } from './preferences';
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
        talkTopics: [],
        learningGoals: [],
        practicePreference: '',
        feedbackLanguage: 'en'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const totalSteps = 4;
    const updateOnboardingData = (field, value) => {
        setOnboardingData(prev => (Object.assign(Object.assign({}, prev), { [field]: value })));
    };
    const toggleTalkTopic = (topicId) => {
        setOnboardingData(prev => (Object.assign(Object.assign({}, prev), { talkTopics: prev.talkTopics.includes(topicId)
                ? prev.talkTopics.filter(id => id !== topicId)
                : [...prev.talkTopics, topicId] })));
    };
    const toggleLearningGoal = (goalId) => {
        setOnboardingData(prev => (Object.assign(Object.assign({}, prev), { learningGoals: prev.learningGoals.includes(goalId)
                ? prev.learningGoals.filter(id => id !== goalId)
                : [...prev.learningGoals, goalId] })));
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
    const renderFeedbackLanguageSelector = () => (_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h3", { style: { color: '#3c4c73', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }, children: "Feedback Language" }), _jsx("p", { style: { color: '#7e5a75', fontSize: '0.9rem', marginBottom: '0.5rem' }, children: "Choose the language in which you want to receive AI feedback and explanations." }), _jsx("select", { value: onboardingData.feedbackLanguage, onChange: e => setOnboardingData(prev => (Object.assign(Object.assign({}, prev), { feedbackLanguage: e.target.value }))), style: {
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #c38d94',
                    fontSize: '1rem',
                    background: '#f8f6f4',
                    color: '#3c4c73',
                    marginBottom: '1rem'
                }, children: FEEDBACK_LANGUAGES.map((lang) => (_jsx("option", { value: lang.code, children: lang.label }, lang.code))) })] }));
    const handleSubmit = () => __awaiter(this, void 0, void 0, function* () {
        if (!validateStep()) {
            setError(getStepError());
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = yield API.post('/api/user/onboarding', {
                language: onboardingData.language,
                proficiency: onboardingData.proficiency,
                talkTopics: onboardingData.talkTopics,
                learningGoals: onboardingData.learningGoals,
                practicePreference: onboardingData.practicePreference,
                feedbackLanguage: onboardingData.feedbackLanguage
            });
            setUser(response.data.user);
            navigate('/dashboard');
        }
        catch (err) {
            setError('Failed to save onboarding. Please try again.');
            setIsLoading(false);
        }
    });
    const renderProgressBar = () => (_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }, children: [_jsxs("span", { style: { color: '#7e5a75', fontSize: '0.9rem', fontWeight: 600 }, children: ["Step ", currentStep, " of ", totalSteps] }), _jsxs("span", { style: { color: '#7e5a75', fontSize: '0.9rem' }, children: [Math.round((currentStep / totalSteps) * 100), "% Complete"] })] }), _jsx("div", { style: {
                    width: '100%',
                    height: '6px',
                    backgroundColor: 'rgba(126,90,117,0.2)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                }, children: _jsx("div", { style: {
                        width: `${(currentStep / totalSteps) * 100}%`,
                        height: '100%',
                        backgroundColor: '#7e5a75',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                    } }) })] }));
    const renderStep1 = () => (_jsxs("div", { children: [_jsx("h2", { style: { color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }, children: "Which language would you like to learn?" }), _jsx("p", { style: { color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }, children: "Choose the language you want to practice speaking with AI feedback" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }, children: LANGUAGES.map((lang) => (_jsxs("div", { onClick: () => updateOnboardingData('language', lang.code), style: {
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: `2px solid ${onboardingData.language === lang.code ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                        backgroundColor: onboardingData.language === lang.code ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center'
                    }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '0.5rem' }, children: lang.flag }), _jsx("div", { style: { fontWeight: 600, color: '#3c4c73', marginBottom: '0.25rem' }, children: lang.label }), _jsx("div", { style: { fontSize: '0.9rem', color: '#7e5a75' }, children: lang.description })] }, lang.code))) })] }));
    const renderStep2 = () => (_jsxs("div", { children: [_jsx("h2", { style: { color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }, children: "What's your current level?" }), _jsx("p", { style: { color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }, children: "Be honest - this helps us personalize your experience" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }, children: PROFICIENCY_LEVELS.map((level) => (_jsxs("div", { onClick: () => updateOnboardingData('proficiency', level.level), style: {
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: `2px solid ${onboardingData.proficiency === level.level ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                        backgroundColor: onboardingData.proficiency === level.level ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }, children: [_jsx("div", { style: { fontSize: '2rem' }, children: level.icon }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, color: '#3c4c73', marginBottom: '0.25rem' }, children: level.label }), _jsx("div", { style: { fontSize: '0.9rem', color: '#7e5a75' }, children: level.description })] })] }, level.level))) }), renderFeedbackLanguageSelector()] }));
    const renderStep3 = () => (_jsxs("div", { children: [_jsx("h2", { style: { color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }, children: "What would you like to focus on?" }), _jsx("p", { style: { color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }, children: "Choose topics you'd like to discuss and skills you want to develop" }), _jsxs("div", { style: { marginBottom: '2.5rem' }, children: [_jsx("h3", { style: { color: '#3c4c73', fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: "\uD83D\uDCAC Topics I'd like to talk about" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }, children: TALK_TOPICS.map((topic) => (_jsxs("div", { onClick: () => toggleTalkTopic(topic.id), style: {
                                padding: '1rem',
                                borderRadius: '8px',
                                border: `2px solid ${onboardingData.talkTopics.includes(topic.id) ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                                backgroundColor: onboardingData.talkTopics.includes(topic.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }, children: [_jsx("div", { style: { fontSize: '1.2rem' }, children: topic.icon }), _jsx("div", { style: { fontWeight: 500, color: '#3c4c73', fontSize: '0.9rem' }, children: topic.label })] }, topic.id))) })] }), _jsxs("div", { children: [_jsx("h3", { style: { color: '#3c4c73', fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: "\uD83C\uDFAF Skills I want to develop" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }, children: LEARNING_GOALS.map((goal) => (_jsxs("div", { onClick: () => toggleLearningGoal(goal.id), style: {
                                padding: '1rem',
                                borderRadius: '8px',
                                border: `2px solid ${onboardingData.learningGoals.includes(goal.id) ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                                backgroundColor: onboardingData.learningGoals.includes(goal.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }, children: [_jsx("div", { style: { fontSize: '1.2rem' }, children: goal.icon }), _jsx("div", { style: { fontWeight: 500, color: '#3c4c73', fontSize: '0.9rem' }, children: goal.label })] }, goal.id))) })] })] }));
    const renderStep4 = () => (_jsxs("div", { children: [_jsx("h2", { style: { color: '#3c4c73', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }, children: "How do you prefer to practice?" }), _jsx("p", { style: { color: '#7e5a75', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem' }, children: "Choose what works best for your schedule" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }, children: PRACTICE_PREFERENCES.map((pref) => (_jsxs("div", { onClick: () => updateOnboardingData('practicePreference', pref.id), style: {
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: `2px solid ${onboardingData.practicePreference === pref.id ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                        backgroundColor: onboardingData.practicePreference === pref.id ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }, children: [_jsx("div", { style: { fontWeight: 600, color: '#3c4c73', marginBottom: '0.25rem' }, children: pref.label }), _jsx("div", { style: { fontSize: '0.9rem', color: '#7e5a75' }, children: pref.description })] }, pref.id))) }), _jsxs("div", { style: {
                    background: 'rgba(126,90,117,0.1)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    marginTop: '2rem'
                }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '0.5rem' }, children: "\uD83C\uDF89" }), _jsx("h3", { style: { color: '#3c4c73', marginBottom: '0.5rem' }, children: "You're all set!" }), _jsx("p", { style: { color: '#7e5a75', fontSize: '0.9rem' }, children: "Click \"Complete Setup\" to access your personalized dashboard and start your first practice session." })] })] }));
    return (_jsx("div", { style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }, children: _jsxs("div", { style: {
                background: '#fff',
                borderRadius: 20,
                padding: '3rem',
                boxShadow: '0 20px 60px rgba(60,76,115,0.15)',
                maxWidth: 600,
                width: '100%',
                position: 'relative',
                overflow: 'hidden'
            }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '2rem' }, children: [_jsx("div", { style: { fontSize: '2.5rem', marginBottom: '0.5rem' }, children: "\uD83D\uDDDD\uFE0F" }), _jsx("h1", { style: {
                                color: '#3c4c73',
                                fontSize: '2rem',
                                fontWeight: 700,
                                marginBottom: '0.5rem',
                                fontFamily: 'Grandstander, Arial, sans-serif'
                            }, children: "Welcome to BeyondWords!" }), _jsx("p", { style: { color: '#7e5a75', fontSize: '1rem' }, children: "Let's personalize your language learning journey" })] }), renderProgressBar(), error && (_jsx("div", { style: {
                        background: 'rgba(220,53,69,0.1)',
                        color: '#dc3545',
                        padding: '0.75rem',
                        borderRadius: 8,
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(220,53,69,0.2)',
                        textAlign: 'center'
                    }, children: error })), _jsx("div", { style: { marginBottom: '2rem' }, children: (() => {
                        try {
                            switch (currentStep) {
                                case 1: return renderStep1();
                                case 2: return renderStep2();
                                case 3: return renderStep3();
                                case 4: return renderStep4();
                                default: return _jsx("div", { children: "Invalid step" });
                            }
                        }
                        catch (err) {
                            console.error('Error rendering step:', err);
                            return _jsx("div", { style: { color: '#dc3545' }, children: "Error loading step content. Please refresh." });
                        }
                    })() }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("button", { onClick: prevStep, disabled: currentStep === 1, style: {
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
                            }, children: "\u2190 Back" }), currentStep < totalSteps ? (_jsx("button", { onClick: handleNext, style: {
                                padding: '0.75rem 2rem',
                                borderRadius: 10,
                                border: 'none',
                                background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }, children: "Next \u2192" })) : (_jsx("button", { onClick: handleSubmit, disabled: isLoading, style: {
                                padding: '0.75rem 2rem',
                                borderRadius: 10,
                                border: 'none',
                                background: isLoading ? '#ccc' : 'linear-gradient(135deg, #c38d94 0%, #7e5a75 100%)',
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }, children: isLoading ? 'Setting up...' : '🎉 Complete Setup' }))] })] }) }));
}
export default Onboarding;
