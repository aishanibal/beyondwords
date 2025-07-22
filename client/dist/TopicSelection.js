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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './App';
import axios from 'axios';
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
function TopicSelection() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [userSavedTopics, setUserSavedTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (user === null || user === void 0 ? void 0 : user.talk_topics) {
            setUserSavedTopics(user.talk_topics);
            setSelectedTopics(user.talk_topics.slice(0, 3)); // Pre-select first 3 saved topics
        }
    }, [user]);
    const toggleTopic = (topicId) => {
        setSelectedTopics((prev) => prev.includes(topicId)
            ? prev.filter((id) => id !== topicId)
            : [...prev, topicId]);
    };
    const startConversation = () => __awaiter(this, void 0, void 0, function* () {
        if (selectedTopics.length === 0) {
            setError('Please select at least one topic to discuss.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // Create conversation with selected topics
            const response = yield API.post('/api/conversations', {
                language: (user === null || user === void 0 ? void 0 : user.target_language) || 'en',
                title: `${selectedTopics.map(id => { var _a; return (_a = TALK_TOPICS.find(t => t.id === id)) === null || _a === void 0 ? void 0 : _a.label; }).join(', ')} Discussion`,
                topics: selectedTopics
            });
            const conversationId = response.data.conversation.id;
            // Navigate to analyze page with conversation ID and selected topics
            const topicsParam = selectedTopics.join(',');
            navigate(`/analyze?conversation=${conversationId}&topics=${topicsParam}`);
        }
        catch (err) {
            console.error('Error creating conversation:', err);
            setError('Failed to start conversation. Please try again.');
            setIsLoading(false);
        }
    });
    const getTopicById = (id) => TALK_TOPICS.find((topic) => topic.id === id);
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
                maxWidth: 700,
                width: '100%'
            }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '2rem' }, children: [_jsx("div", { style: { fontSize: '2.5rem', marginBottom: '0.5rem' }, children: "\uD83D\uDCAC" }), _jsx("h1", { style: {
                                color: '#3c4c73',
                                fontSize: '2rem',
                                fontWeight: 700,
                                marginBottom: '0.5rem',
                                fontFamily: 'Grandstander, Arial, sans-serif'
                            }, children: "Choose Your Topics" }), _jsx("p", { style: { color: '#7e5a75', fontSize: '1rem' }, children: "Select topics you'd like to discuss in this practice session" })] }), error && (_jsx("div", { style: {
                        background: 'rgba(220,53,69,0.1)',
                        color: '#dc3545',
                        padding: '0.75rem',
                        borderRadius: 8,
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(220,53,69,0.2)',
                        textAlign: 'center'
                    }, children: error })), userSavedTopics.length > 0 && (_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h3", { style: {
                                color: '#3c4c73',
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }, children: "\u2B50 Your Favorite Topics" }), _jsx("div", { style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '0.75rem',
                                marginBottom: '1rem'
                            }, children: userSavedTopics.map(topicId => {
                                const topic = getTopicById(topicId);
                                if (!topic)
                                    return null;
                                return (_jsxs("div", { onClick: () => toggleTopic(topic.id), style: {
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        border: `2px solid ${selectedTopics.includes(topic.id) ? '#7e5a75' : 'rgba(126,90,117,0.3)'}`,
                                        backgroundColor: selectedTopics.includes(topic.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }, children: [_jsx("div", { style: { fontSize: '1.1rem' }, children: topic.icon }), _jsx("div", { style: { fontWeight: 500, color: '#3c4c73', fontSize: '0.9rem' }, children: topic.label })] }, topic.id));
                            }) })] })), _jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h3", { style: {
                                color: '#3c4c73',
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }, children: "\uD83C\uDF1F All Topics" }), _jsx("div", { style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '0.75rem'
                            }, children: TALK_TOPICS.map(topic => (_jsxs("div", { onClick: () => toggleTopic(topic.id), style: {
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: `2px solid ${selectedTopics.includes(topic.id) ? '#7e5a75' : 'rgba(126,90,117,0.2)'}`,
                                    backgroundColor: selectedTopics.includes(topic.id) ? 'rgba(126,90,117,0.1)' : '#f8f6f4',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: userSavedTopics.includes(topic.id) ? 0.6 : 1
                                }, children: [_jsx("div", { style: { fontSize: '1.1rem' }, children: topic.icon }), _jsx("div", { style: { fontWeight: 500, color: '#3c4c73', fontSize: '0.9rem' }, children: topic.label })] }, topic.id))) })] }), selectedTopics.length > 0 && (_jsxs("div", { style: {
                        background: 'rgba(126,90,117,0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '2rem'
                    }, children: [_jsxs("h4", { style: { color: '#3c4c73', marginBottom: '0.5rem', fontSize: '1rem' }, children: ["Selected Topics (", selectedTopics.length, "):"] }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }, children: selectedTopics.map(topicId => {
                                const topic = getTopicById(topicId);
                                return (_jsxs("span", { style: {
                                        background: '#7e5a75',
                                        color: '#fff',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }, children: [topic === null || topic === void 0 ? void 0 : topic.icon, " ", topic === null || topic === void 0 ? void 0 : topic.label] }, topicId));
                            }) })] })), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("button", { onClick: () => navigate('/dashboard'), style: {
                                padding: '0.75rem 1.5rem',
                                borderRadius: 10,
                                border: '2px solid rgba(126,90,117,0.3)',
                                background: 'transparent',
                                color: '#7e5a75',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }, children: "\u2190 Back to Dashboard" }), _jsx("button", { onClick: startConversation, disabled: isLoading || selectedTopics.length === 0, style: {
                                padding: '0.75rem 2rem',
                                borderRadius: 10,
                                border: 'none',
                                background: isLoading || selectedTopics.length === 0 ? '#ccc' :
                                    'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                                color: '#fff',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isLoading || selectedTopics.length === 0 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                            }, children: isLoading ? '🔄 Starting...' : '🎤 Start Practice Session' })] })] }) }));
}
export default TopicSelection;
