var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useUser } from './App';
import axios from 'axios';
import { Link } from 'react-router-dom';
import LanguageOnboarding from './LanguageOnboarding';
const TALK_TOPICS = [
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
function Dashboard() {
    var _a, _b, _c, _d;
    const { user } = useUser();
    const [languageDashboards, setLanguageDashboards] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showLanguageOnboarding, setShowLanguageOnboarding] = useState(false);
    const [showDashboardSettings, setShowDashboardSettings] = useState(false);
    useEffect(() => {
        function fetchDashboardData() {
            return __awaiter(this, void 0, void 0, function* () {
                setLoading(true);
                setError('');
                try {
                    // Fetch language dashboards
                    const dashboardsRes = yield API.get('/api/user/language-dashboards');
                    const dashboards = dashboardsRes.data.dashboards || [];
                    // Ensure arrays are properly initialized
                    const processedDashboards = dashboards.map((dashboard) => (Object.assign(Object.assign({}, dashboard), { talk_topics: dashboard.talk_topics || [], learning_goals: dashboard.learning_goals || [] })));
                    setLanguageDashboards(processedDashboards);
                    // Set default selected language to primary dashboard
                    const primaryDashboard = processedDashboards.find((d) => d.is_primary);
                    let currentLanguage = selectedLanguage;
                    console.log('🔍 FRONTEND: Primary dashboard:', primaryDashboard);
                    console.log('🔍 FRONTEND: Current selectedLanguage:', selectedLanguage);
                    if (primaryDashboard && !selectedLanguage) {
                        currentLanguage = primaryDashboard.language;
                        console.log('🔄 FRONTEND: Setting selectedLanguage to:', currentLanguage);
                        setSelectedLanguage(currentLanguage);
                    }
                    // Conversations will be fetched by the separate useEffect when selectedLanguage changes
                }
                catch (err) {
                    console.error('Error fetching dashboard data:', err);
                    setError('Failed to load dashboard data.');
                }
                finally {
                    setLoading(false);
                }
            });
        }
        if (user === null || user === void 0 ? void 0 : user.id) {
            fetchDashboardData();
        }
    }, [user]);
    // Separate effect to fetch conversations when selectedLanguage changes
    useEffect(() => {
        function fetchConversations() {
            return __awaiter(this, void 0, void 0, function* () {
                if (selectedLanguage && (user === null || user === void 0 ? void 0 : user.id)) {
                    try {
                        console.log('🔍 FRONTEND: Fetching conversations for language:', selectedLanguage);
                        // Clear conversations first to avoid showing old data
                        setConversations([]);
                        const conversationsRes = yield API.get(`/api/conversations?language=${selectedLanguage}`);
                        console.log('📥 FRONTEND: Received conversations:', conversationsRes.data.conversations);
                        setConversations(conversationsRes.data.conversations || []);
                    }
                    catch (err) {
                        console.error('Error fetching conversations:', err);
                        setConversations([]); // Clear on error too
                    }
                }
            });
        }
        fetchConversations();
    }, [selectedLanguage, user === null || user === void 0 ? void 0 : user.id]);
    // Helper functions
    const getLanguageInfo = (code) => {
        const languages = {
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
    const getProficiencyDisplay = (level) => {
        const levels = {
            'beginner': { label: 'Beginner', icon: '🌱' },
            'elementary': { label: 'Elementary', icon: '🌿' },
            'intermediate': { label: 'Intermediate', icon: '🌳' },
            'advanced': { label: 'Advanced', icon: '🏔️' },
            'fluent': { label: 'Fluent', icon: '🗝️' }
        };
        return levels[level] || { label: level, icon: '🌱' };
    };
    const deleteConversation = (conversationId) => __awaiter(this, void 0, void 0, function* () {
        if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
            return;
        }
        try {
            yield API.delete(`/api/conversations/${conversationId}`);
            setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
        }
        catch (error) {
            console.error('Error deleting conversation:', error);
            alert('Failed to delete conversation. Please try again.');
        }
    });
    const handleLanguageOnboardingComplete = (newDashboard) => {
        console.log('🔍 FRONTEND: New dashboard from onboarding:', newDashboard);
        // Ensure arrays are properly initialized for the new dashboard
        const processedDashboard = Object.assign(Object.assign({}, newDashboard), { talk_topics: newDashboard.talk_topics || [], learning_goals: newDashboard.learning_goals || [] });
        console.log('🔄 FRONTEND: Processed dashboard:', processedDashboard);
        setLanguageDashboards((prev) => [...prev, processedDashboard]);
        setShowLanguageOnboarding(false);
        setSelectedLanguage(newDashboard.language);
    };
    // Get current dashboard and ensure arrays are initialized
    const currentDashboard = languageDashboards.find((d) => d.language === selectedLanguage);
    if (currentDashboard) {
        currentDashboard.talk_topics = currentDashboard.talk_topics || [];
        currentDashboard.learning_goals = currentDashboard.learning_goals || [];
    }
    // Calculate usage stats
    const [streak, setStreak] = useState(0);
    // Optionally: const [usageByDay, setUsageByDay] = useState([]);
    useEffect(() => {
        function fetchStreak() {
            return __awaiter(this, void 0, void 0, function* () {
                if ((user === null || user === void 0 ? void 0 : user.id) && selectedLanguage) {
                    try {
                        const res = yield API.get(`/api/user/streak?userId=${user.id}&language=${selectedLanguage}`);
                        setStreak(res.data.streak || 0);
                        // Optionally: setUsageByDay(res.data.days || []);
                    }
                    catch (err) {
                        setStreak(0);
                    }
                }
            });
        }
        fetchStreak();
    }, [user === null || user === void 0 ? void 0 : user.id, selectedLanguage]);
    // Dashboard Settings Modal Component
    const DashboardSettingsModal = ({ dashboard, isOpen, onClose, onUpdate }) => {
        const [editedDashboard, setEditedDashboard] = useState(dashboard);
        const [isSaving, setIsSaving] = useState(false);
        const [isDeleting, setIsDeleting] = useState(false);
        const [saveError, setSaveError] = useState('');
        useEffect(() => {
            if (dashboard) {
                setEditedDashboard(Object.assign(Object.assign({}, dashboard), { talk_topics: dashboard.talk_topics || [], learning_goals: dashboard.learning_goals || [] }));
            }
        }, [dashboard]);
        const handleTopicToggle = (topicId) => {
            setEditedDashboard((prev) => (Object.assign(Object.assign({}, prev), { talk_topics: prev.talk_topics.includes(topicId)
                    ? prev.talk_topics.filter((id) => id !== topicId)
                    : [...prev.talk_topics, topicId] })));
        };
        const handleSave = () => __awaiter(this, void 0, void 0, function* () {
            setIsSaving(true);
            setSaveError('');
            try {
                const response = yield API.put(`/api/user/language-dashboards/${dashboard.language}`, {
                    proficiency_level: editedDashboard.proficiency_level,
                    talk_topics: editedDashboard.talk_topics,
                    learning_goals: editedDashboard.learning_goals
                });
                onUpdate(response.data.dashboard);
                onClose();
            }
            catch (err) {
                console.error('Error updating dashboard:', err);
                setSaveError('Failed to update dashboard settings. Please try again.');
            }
            finally {
                setIsSaving(false);
            }
        });
        const handleDelete = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const confirmMessage = `Are you sure you want to delete your ${getLanguageInfo(dashboard.language).label} dashboard? This will permanently delete all conversations and messages in this language. This action cannot be undone.`;
            if (!window.confirm(confirmMessage)) {
                return;
            }
            setIsDeleting(true);
            setSaveError('');
            try {
                yield API.delete(`/api/user/language-dashboards/${dashboard.language}`);
                // Remove the dashboard from the state
                setLanguageDashboards((prev) => prev.filter((d) => d.language !== dashboard.language));
                // If this was the selected language, switch to another one
                if (selectedLanguage === dashboard.language) {
                    const remainingDashboards = languageDashboards.filter((d) => d.language !== dashboard.language);
                    const newSelectedLanguage = ((_a = remainingDashboards.find((d) => d.is_primary)) === null || _a === void 0 ? void 0 : _a.language) || ((_b = remainingDashboards[0]) === null || _b === void 0 ? void 0 : _b.language);
                    setSelectedLanguage(newSelectedLanguage);
                }
                onClose();
            }
            catch (err) {
                console.error('Error deleting dashboard:', err);
                if ((_d = (_c = err.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) {
                    setSaveError(err.response.data.error);
                }
                else {
                    setSaveError('Failed to delete dashboard. Please try again.');
                }
            }
            finally {
                setIsDeleting(false);
            }
        });
        if (!isOpen)
            return null;
        return (_jsx("div", { style: {
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
            }, children: _jsxs("div", { style: {
                    background: '#fff',
                    borderRadius: 20,
                    padding: '1.5rem',
                    boxShadow: '0 20px 60px rgba(60,76,115,0.25)',
                    maxWidth: 'min(600px, 90vw)',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '2rem' }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '0.5rem' }, children: "\u2699\uFE0F" }), _jsx("h2", { style: {
                                    color: '#3c4c73',
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    marginBottom: '0.5rem',
                                    fontFamily: 'Grandstander, Arial, sans-serif'
                                }, children: "Dashboard Settings" }), _jsxs("p", { style: { color: '#7e5a75', fontSize: '0.9rem', margin: 0 }, children: ["Customize your ", getLanguageInfo(dashboard.language).label, " learning experience"] })] }), saveError && (_jsx("div", { style: {
                            background: 'rgba(220,53,69,0.1)',
                            color: '#dc3545',
                            padding: '0.75rem',
                            borderRadius: 8,
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(220,53,69,0.2)',
                            textAlign: 'center'
                        }, children: saveError })), _jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h3", { style: {
                                    color: '#3c4c73',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    marginBottom: '1rem'
                                }, children: "\uD83D\uDCCA Proficiency Level" }), _jsx("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                    gap: '0.5rem'
                                }, children: ['beginner', 'elementary', 'intermediate', 'advanced', 'fluent'].map(level => {
                                    const isSelected = editedDashboard.proficiency_level === level;
                                    const profInfo = getProficiencyDisplay(level);
                                    return (_jsxs("button", { onClick: () => setEditedDashboard((prev) => (Object.assign(Object.assign({}, prev), { proficiency_level: level }))), style: {
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
                                        }, children: [_jsx("span", { children: profInfo.icon }), profInfo.label] }, level));
                                }) })] }), _jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h3", { style: {
                                    color: '#3c4c73',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    marginBottom: '1rem'
                                }, children: "\uD83D\uDCAC Conversation Topics" }), _jsx("p", { style: {
                                    color: '#7e5a75',
                                    fontSize: '0.85rem',
                                    marginBottom: '1rem',
                                    lineHeight: 1.4
                                }, children: "Choose topics you'd like to practice. You can select multiple topics." }), _jsx("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '0.5rem'
                                }, children: TALK_TOPICS.map(topic => {
                                    const isSelected = editedDashboard.talk_topics.includes(topic.id);
                                    return (_jsxs("div", { onClick: () => handleTopicToggle(topic.id), style: {
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: `2px solid ${isSelected ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                                            backgroundColor: isSelected ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }, children: [_jsx("div", { style: { fontSize: '1.2rem' }, children: topic.icon }), _jsx("div", { style: {
                                                    fontWeight: 500,
                                                    color: '#3c4c73',
                                                    fontSize: '0.85rem',
                                                    flex: 1
                                                }, children: topic.label }), isSelected && (_jsx("div", { style: { color: '#7e5a75', fontSize: '1rem' }, children: "\u2713" }))] }, topic.id));
                                }) })] }), _jsxs("div", { style: {
                            background: 'rgba(220,53,69,0.1)',
                            border: '1px solid rgba(220,53,69,0.2)',
                            borderRadius: 8,
                            padding: '1rem',
                            marginBottom: '1.5rem'
                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }, children: [_jsx("span", { style: { fontSize: '1.2rem' }, children: "\u26A0\uFE0F" }), _jsx("div", { style: { color: '#dc3545', fontWeight: 600, fontSize: '0.9rem' }, children: "Danger Zone" })] }), _jsxs("p", { style: {
                                    color: '#dc3545',
                                    fontSize: '0.85rem',
                                    margin: 0,
                                    lineHeight: 1.4
                                }, children: ["Deleting this dashboard will permanently remove all conversations, messages, and settings for ", getLanguageInfo(dashboard.language).label, ". This action cannot be undone."] })] }), _jsxs("div", { style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                        }, children: [_jsxs("div", { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }, children: [_jsx("button", { onClick: onClose, style: {
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
                                        }, children: "Cancel" }), _jsx("button", { onClick: handleDelete, disabled: isDeleting || isSaving, style: {
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
                                        }, children: isDeleting ? '🗑️ Deleting...' : '🗑️ Delete' })] }), _jsx("button", { onClick: handleSave, disabled: isSaving || isDeleting, style: {
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
                                }, children: isSaving ? '💾 Saving...' : '💾 Save Changes' })] })] }) }));
    };
    // Handle dashboard update
    const handleDashboardUpdate = (updatedDashboard) => {
        setLanguageDashboards((prev) => prev.map((dashboard) => dashboard.language === updatedDashboard.language
            ? Object.assign(Object.assign({}, dashboard), updatedDashboard) : dashboard));
    };
    if (showLanguageOnboarding) {
        return (_jsx(LanguageOnboarding, { onComplete: handleLanguageOnboardingComplete, existingLanguages: (languageDashboards || []).map((d) => d.language) }));
    }
    return (_jsxs("div", { style: { minHeight: '100vh', background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)', padding: '2rem' }, children: [_jsxs("div", { style: { maxWidth: 1000, margin: '0 auto' }, children: [_jsxs("div", { style: { background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(60,76,115,0.12)', padding: '2.5rem 2rem', marginBottom: '2rem' }, children: [_jsxs("h1", { style: { color: '#3c4c73', fontFamily: 'Grandstander, Arial, sans-serif', fontWeight: 700, fontSize: '2rem', marginBottom: '1rem' }, children: ["Welcome back, ", (_a = user === null || user === void 0 ? void 0 : user.name) === null || _a === void 0 ? void 0 : _a.split(' ')[0], "!"] }), _jsx("p", { style: { color: '#7e5a75', fontSize: '1rem', marginBottom: '2rem' }, children: "Your multilingual journey dashboard" }), _jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h3", { style: { color: '#3c4c73', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }, children: "\uD83D\uDCDA Your Language Dashboards" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }, children: [(languageDashboards || []).map((dashboard) => {
                                                const langInfo = getLanguageInfo(dashboard.language);
                                                const profInfo = getProficiencyDisplay(dashboard.proficiency_level);
                                                const isSelected = selectedLanguage === dashboard.language;
                                                return (_jsxs("button", { onClick: () => setSelectedLanguage(dashboard.language), style: {
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
                                                    }, children: [_jsx("span", { style: { fontSize: '1.2rem' }, children: langInfo.flag }), _jsxs("div", { style: { textAlign: 'left' }, children: [_jsx("div", { children: langInfo.label }), _jsxs("div", { style: {
                                                                        fontSize: '0.75rem',
                                                                        opacity: 0.8,
                                                                        color: isSelected ? '#f8f6f4' : '#7e5a75'
                                                                    }, children: [profInfo.icon, " ", profInfo.label] })] }), dashboard.is_primary && (_jsx("span", { style: {
                                                                background: isSelected ? 'rgba(248,246,244,0.3)' : 'rgba(126,90,117,0.1)',
                                                                color: isSelected ? '#f8f6f4' : '#7e5a75',
                                                                padding: '0.2rem 0.5rem',
                                                                borderRadius: 4,
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600
                                                            }, children: "PRIMARY" }))] }, dashboard.language));
                                            }), _jsxs("button", { onClick: () => setShowLanguageOnboarding(true), style: {
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
                                                }, children: [_jsx("span", { style: { fontSize: '1.2rem' }, children: "\u2795" }), "Add Language"] })] })] })] }), currentDashboard && currentDashboard.language && (_jsxs(_Fragment, { children: [_jsx("div", { style: { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '2rem', marginBottom: '2rem' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }, children: [_jsx("span", { style: { fontSize: '2rem' }, children: getLanguageInfo(currentDashboard.language).flag }), _jsx("h2", { style: { color: '#3c4c73', fontSize: '1.5rem', fontWeight: 700, margin: 0 }, children: getLanguageInfo(currentDashboard.language).label }), _jsx("span", { style: {
                                                                background: '#7e5a75',
                                                                color: '#fff',
                                                                padding: '0.3rem 0.75rem',
                                                                borderRadius: 6,
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600
                                                            }, children: getProficiencyDisplay(currentDashboard.proficiency_level).label })] }), _jsxs("div", { style: { color: '#7e5a75', fontSize: '0.9rem' }, children: [(((_b = currentDashboard.talk_topics) === null || _b === void 0 ? void 0 : _b.length) || 0), " topics \u2022 ", (((_c = currentDashboard.learning_goals) === null || _c === void 0 ? void 0 : _c.length) || 0), " goals"] })] }), _jsxs("div", { style: { display: 'flex', gap: '1rem', alignItems: 'center' }, children: [_jsx("button", { onClick: () => setShowDashboardSettings(true), style: {
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
                                                    }, children: "\u2699\uFE0F Settings" }), _jsx(Link, { to: `/analyze?language=${currentDashboard.language}`, style: {
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
                                                    }, children: "\uD83C\uDFA4 Practice Now" })] })] }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }, children: [_jsxs("div", { style: { background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '1.5rem', marginBottom: '0.5rem' }, children: "\uD83D\uDD25" }), _jsx("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: '#c38d94', marginBottom: '0.25rem' }, children: streak }), _jsx("div", { style: { color: '#7e5a75', fontSize: '0.8rem' }, children: "Day Streak" })] }), _jsxs("div", { style: { background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '1.5rem', marginBottom: '0.5rem' }, children: "\uD83D\uDCAC" }), _jsx("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: '#7e5a75', marginBottom: '0.25rem' }, children: (conversations || []).length }), _jsx("div", { style: { color: '#7e5a75', fontSize: '0.8rem' }, children: "Conversations" })] }), _jsxs("div", { style: { background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '1.5rem', marginBottom: '0.5rem' }, children: "\uD83C\uDFAF" }), _jsx("div", { style: { fontSize: '1.5rem', fontWeight: 700, color: '#3c4c73', marginBottom: '0.25rem' }, children: ((_d = currentDashboard.learning_goals) === null || _d === void 0 ? void 0 : _d.length) || 0 }), _jsx("div", { style: { color: '#7e5a75', fontSize: '0.8rem' }, children: "Active Goals" })] })] }), _jsxs("div", { style: { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '2rem' }, children: [_jsx("h3", { style: { color: '#3c4c73', fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }, children: "Recent Conversations" }), loading ? (_jsx("div", { style: { textAlign: 'center', padding: '2rem', color: '#7e5a75' }, children: "Loading conversations..." })) : error ? (_jsx("div", { style: { color: '#dc3545', textAlign: 'center', padding: '2rem' }, children: error })) : (conversations || []).length === 0 ? (_jsxs("div", { style: {
                                            textAlign: 'center',
                                            padding: '2rem',
                                            color: '#7e5a75',
                                            background: 'rgba(126,90,117,0.05)',
                                            borderRadius: 12,
                                            border: '2px dashed rgba(126,90,117,0.2)'
                                        }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '0.5rem' }, children: "\uD83C\uDFA4" }), _jsx("div", { style: { fontWeight: 600, marginBottom: '0.5rem' }, children: "Start your first conversation!" }), _jsxs("div", { style: { fontSize: '0.9rem', opacity: 0.8 }, children: ["Click \"Practice Now\" to begin learning ", getLanguageInfo(currentDashboard.language).label] })] })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: (conversations || []).slice(0, 5).map((conversation) => (_jsxs("div", { style: {
                                                background: 'rgba(126,90,117,0.05)',
                                                borderRadius: 12,
                                                padding: '1rem',
                                                border: '1px solid rgba(126,90,117,0.1)',
                                                transition: 'all 0.3s ease'
                                            }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx("div", { style: { fontWeight: 600, color: '#3c4c73' }, children: conversation.title || 'Untitled Conversation' }), _jsx("div", { style: { color: '#7e5a75', fontSize: '0.8rem' }, children: new Date(conversation.created_at).toLocaleDateString() })] }), _jsxs("div", { style: { display: 'flex', gap: '0.5rem', alignItems: 'center' }, children: [_jsx(Link, { to: `/analyze?conversation=${conversation.id}&language=${currentDashboard.language}`, style: {
                                                                        color: '#7e5a75',
                                                                        fontWeight: 600,
                                                                        textDecoration: 'none',
                                                                        fontSize: '0.9rem',
                                                                        padding: '0.25rem 0.75rem',
                                                                        borderRadius: 6,
                                                                        background: 'rgba(126,90,117,0.1)',
                                                                        transition: 'all 0.3s ease'
                                                                    }, children: "Continue \u2192" }), _jsx("button", { onClick: () => deleteConversation(conversation.id), style: {
                                                                        color: '#dc3545',
                                                                        background: 'rgba(220,53,69,0.1)',
                                                                        border: 'none',
                                                                        borderRadius: 6,
                                                                        padding: '0.25rem 0.5rem',
                                                                        fontSize: '0.8rem',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s ease'
                                                                    }, title: "Delete conversation", children: "\uD83D\uDDD1\uFE0F" })] })] }), _jsxs("div", { style: { color: '#7e5a75', fontSize: '0.9rem', opacity: 0.8 }, children: ["\uD83D\uDCAC ", conversation.message_count || 0, " messages"] })] }, conversation.id))) }))] })] }))] }), currentDashboard && (_jsx(DashboardSettingsModal, { dashboard: currentDashboard, isOpen: showDashboardSettings, onClose: () => setShowDashboardSettings(false), onUpdate: handleDashboardUpdate }))] }));
}
export default Dashboard;
