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
import { useUser } from './App';
import axios from 'axios';
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
function Profile() {
    const { user, setUser } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profileData, setProfileData] = useState({
        name: '',
        email: ''
    });
    useEffect(() => {
        if (user) {
            console.log('Setting profile data from user:', user);
            setProfileData({
                name: user.name || '',
                email: user.email || ''
            });
        }
    }, [user]);
    const handleInputChange = (field, value) => {
        setProfileData(prev => (Object.assign(Object.assign({}, prev), { [field]: value })));
        setError('');
        setSuccess('');
    };
    const handleSave = () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        setIsSaving(true);
        setError('');
        setSuccess('');
        console.log('Saving profile data:', profileData);
        console.log('Current user:', user);
        // Basic validation
        if (!profileData.name || !profileData.email) {
            setError('Please fill in all required fields');
            setIsSaving(false);
            return;
        }
        try {
            const requestData = {
                name: profileData.name,
                email: profileData.email
            };
            console.log('Making PUT request with data:', requestData);
            const response = yield API.put('/api/user/profile', requestData);
            console.log('Profile update response:', response.data);
            setUser(response.data.user);
            setSuccess('Profile updated successfully!');
        }
        catch (err) {
            console.error('Error updating profile:', err);
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const errorObj = err;
                console.error('Error response:', (_a = errorObj.response) === null || _a === void 0 ? void 0 : _a.data);
                console.error('Error status:', (_b = errorObj.response) === null || _b === void 0 ? void 0 : _b.status);
                setError(((_d = (_c = errorObj.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) || 'Failed to update profile. Please try again.');
            }
            else {
                setError('Failed to update profile. Please try again.');
            }
        }
        finally {
            setIsSaving(false);
        }
    });
    if (!user) {
        return (_jsx("div", { style: {
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)'
            }, children: _jsx("div", { style: { color: '#7e5a75', fontSize: '1.2rem' }, children: "Please log in to view your profile." }) }));
    }
    return (_jsx("div", { style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)',
            padding: '2rem'
        }, children: _jsxs("div", { style: { maxWidth: 800, margin: '0 auto' }, children: [_jsxs("div", { style: {
                        background: '#fff',
                        borderRadius: 20,
                        boxShadow: '0 8px 32px rgba(60,76,115,0.12)',
                        padding: '2.5rem 2rem',
                        marginBottom: '2rem'
                    }, children: [_jsx("h1", { style: {
                                color: '#3c4c73',
                                fontFamily: 'Grandstander, Arial, sans-serif',
                                fontWeight: 700,
                                fontSize: '2rem',
                                marginBottom: '0.5rem'
                            }, children: "\u2699\uFE0F Profile Settings" }), _jsx("p", { style: { color: '#7e5a75', fontSize: '1rem', margin: 0 }, children: "Manage your account information and learning preferences" })] }), error && (_jsx("div", { style: {
                        background: 'rgba(220,53,69,0.1)',
                        color: '#dc3545',
                        padding: '1rem',
                        borderRadius: 12,
                        marginBottom: '2rem',
                        border: '1px solid rgba(220,53,69,0.2)'
                    }, children: error })), success && (_jsx("div", { style: {
                        background: 'rgba(40,167,69,0.1)',
                        color: '#28a745',
                        padding: '1rem',
                        borderRadius: 12,
                        marginBottom: '2rem',
                        border: '1px solid rgba(40,167,69,0.2)'
                    }, children: success })), _jsxs("div", { style: {
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 4px 20px rgba(60,76,115,0.1)',
                        padding: '2rem',
                        marginBottom: '2rem'
                    }, children: [_jsx("h2", { style: {
                                color: '#3c4c73',
                                fontSize: '1.3rem',
                                fontWeight: 600,
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }, children: "\uD83D\uDC64 Personal Information" }), _jsxs("div", { style: { display: 'grid', gap: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: {
                                                display: 'block',
                                                color: '#3c4c73',
                                                fontWeight: 600,
                                                marginBottom: '0.5rem'
                                            }, children: "Full Name" }), _jsx("input", { type: "text", value: profileData.name, onChange: (e) => handleInputChange('name', e.target.value), style: {
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '2px solid rgba(126,90,117,0.2)',
                                                fontSize: '1rem',
                                                fontFamily: 'inherit',
                                                background: '#f8f6f4',
                                                color: '#3c4c73'
                                            } })] }), _jsxs("div", { children: [_jsx("label", { style: {
                                                display: 'block',
                                                color: '#3c4c73',
                                                fontWeight: 600,
                                                marginBottom: '0.5rem'
                                            }, children: "Email Address" }), _jsx("input", { type: "email", value: profileData.email, onChange: (e) => handleInputChange('email', e.target.value), style: {
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                border: '2px solid rgba(126,90,117,0.2)',
                                                fontSize: '1rem',
                                                fontFamily: 'inherit',
                                                background: '#f8f6f4',
                                                color: '#3c4c73'
                                            } })] })] })] }), _jsxs("div", { style: {
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 4px 20px rgba(60,76,115,0.1)',
                        padding: '2rem',
                        marginBottom: '2rem'
                    }, children: [_jsx("h2", { style: {
                                color: '#3c4c73',
                                fontSize: '1.3rem',
                                fontWeight: 600,
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }, children: "\uD83D\uDCDA Language Learning Settings" }), _jsx("p", { style: { color: '#7e5a75', marginBottom: '1.5rem', fontSize: '1rem' }, children: "Language-specific settings like proficiency levels, topics, and goals are now managed in individual language dashboards. You can access and edit these settings from your main dashboard." }), _jsxs("div", { style: {
                                background: 'rgba(126,90,117,0.1)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '2px solid rgba(126,90,117,0.2)'
                            }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }, children: [_jsx("span", { style: { fontSize: '1.5rem' }, children: "\uD83D\uDCA1" }), _jsx("h3", { style: { color: '#3c4c73', fontSize: '1.1rem', fontWeight: 600, margin: 0 }, children: "Quick Access" })] }), _jsx("p", { style: { color: '#7e5a75', fontSize: '0.9rem', marginBottom: '1rem' }, children: "Go to your Dashboard to:" }), _jsxs("ul", { style: { color: '#7e5a75', fontSize: '0.9rem', marginBottom: '1.5rem', paddingLeft: '1.5rem' }, children: [_jsx("li", { children: "Switch between language dashboards" }), _jsx("li", { children: "Add new languages to learn" }), _jsx("li", { children: "Edit proficiency levels and learning goals" }), _jsx("li", { children: "Manage conversation topics for each language" })] }), _jsx("a", { href: "/dashboard", style: {
                                        background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                                        color: '#fff',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: 8,
                                        textDecoration: 'none',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        display: 'inline-block',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 10px rgba(126,90,117,0.3)'
                                    }, children: "Go to Dashboard \u2192" })] })] }), _jsx("div", { style: { textAlign: 'center' }, children: _jsx("button", { onClick: handleSave, disabled: isSaving, style: {
                            padding: '1rem 3rem',
                            borderRadius: 12,
                            border: 'none',
                            background: isSaving ? '#ccc' : 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(126,90,117,0.3)'
                        }, children: isSaving ? '💾 Saving...' : '💾 Save Changes' }) })] }) }));
}
export default Profile;
