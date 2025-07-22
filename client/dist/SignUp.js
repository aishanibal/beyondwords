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
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useUser } from './App';
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
function SignUp() {
    const navigate = useNavigate();
    const { setUser } = useUser();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const handleInputChange = (e) => {
        setFormData(Object.assign(Object.assign({}, formData), { [e.target.name]: e.target.value }));
    };
    const handleEmailSignUp = (e) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        e.preventDefault();
        setIsLoading(true);
        setError('');
        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }
        try {
            const response = yield API.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            // Registration now returns token directly
            if (response.data.token && response.data.user) {
                localStorage.setItem('jwt', response.data.token);
                setUser(response.data.user);
                setIsLoading(false);
                // New users always need onboarding
                navigate('/onboarding');
            }
            else {
                throw new Error('Registration response missing token or user');
            }
        }
        catch (err) {
            console.error('Sign-up error:', err);
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const errorObj = err;
                setError(((_b = (_a = errorObj.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || errorObj.message || 'Sign-up failed. Please try again.');
            }
            else if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('Sign-up failed. Please try again.');
            }
            setIsLoading(false);
        }
    });
    const handleGoogleSuccess = (credentialResponse) => __awaiter(this, void 0, void 0, function* () {
        setIsLoading(true);
        setError('');
        try {
            const response = yield API.post('/auth/google/token', {
                credential: credentialResponse.credential
            });
            if (response.data.user && response.data.token) {
                localStorage.setItem('jwt', response.data.token);
                setUser(response.data.user);
                if (!Boolean(response.data.user.onboarding_complete)) {
                    navigate('/onboarding');
                }
                else {
                    navigate('/dashboard');
                }
            }
        }
        catch (err) {
            console.error('Google sign-up error:', err);
            setError('Google sign-up failed. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    });
    const handleGoogleError = () => {
        setError('Google sign-up failed. Please try again.');
    };
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
                maxWidth: 450,
                width: '100%',
                position: 'relative',
                overflow: 'hidden'
            }, children: [_jsx("div", { style: {
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 100,
                        height: 100,
                        background: 'radial-gradient(circle, rgba(195,141,148,0.1) 0%, transparent 70%)',
                        borderRadius: '50%'
                    } }), _jsx("div", { style: {
                        position: 'absolute',
                        bottom: -30,
                        left: -30,
                        width: 80,
                        height: 80,
                        background: 'radial-gradient(circle, rgba(126,90,117,0.1) 0%, transparent 70%)',
                        borderRadius: '50%'
                    } }), _jsxs("div", { style: { position: 'relative', zIndex: 1 }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '2.5rem' }, children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '1rem' }, children: "\uD83D\uDDDD\uFE0F" }), _jsx("h1", { style: {
                                        color: '#3c4c73',
                                        fontSize: '2.2rem',
                                        fontWeight: 600,
                                        marginBottom: '0.5rem',
                                        fontFamily: 'Grandstander, Arial, sans-serif',
                                        letterSpacing: 1
                                    }, children: "Join BeyondWords" }), _jsx("p", { style: {
                                        color: '#7e5a75',
                                        fontSize: '1.1rem',
                                        opacity: 0.8
                                    }, children: "Start your speech journey today" })] }), error && (_jsx("div", { style: {
                                background: 'rgba(220,53,69,0.1)',
                                color: '#dc3545',
                                padding: '0.75rem',
                                borderRadius: 8,
                                marginBottom: '1.5rem',
                                border: '1px solid rgba(220,53,69,0.2)',
                                textAlign: 'center'
                            }, children: error })), _jsx("div", { style: { marginBottom: '2rem' }, children: _jsx("div", { style: { width: '100%' }, children: _jsx(GoogleLogin, { onSuccess: handleGoogleSuccess, onError: handleGoogleError, theme: "filled_blue", size: "large", text: "signup_with", shape: "rectangular", width: "100%", auto_select: false, cancel_on_tap_outside: true }) }) }), _jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '2rem'
                            }, children: [_jsx("div", { style: {
                                        flex: 1,
                                        height: 1,
                                        background: 'rgba(126,90,117,0.2)'
                                    } }), _jsx("span", { style: {
                                        padding: '0 1rem',
                                        color: '#7e5a75',
                                        fontSize: '0.9rem',
                                        fontWeight: 500
                                    }, children: "or sign up with email" }), _jsx("div", { style: {
                                        flex: 1,
                                        height: 1,
                                        background: 'rgba(126,90,117,0.2)'
                                    } })] }), _jsxs("form", { onSubmit: handleEmailSignUp, children: [_jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: {
                                                display: 'block',
                                                marginBottom: '0.5rem',
                                                color: '#3c4c73',
                                                fontWeight: 500,
                                                fontSize: '0.95rem'
                                            }, children: "Full Name" }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleInputChange, required: true, style: {
                                                width: '100%',
                                                padding: '0.875rem 1rem',
                                                borderRadius: 10,
                                                border: '2px solid rgba(126,90,117,0.2)',
                                                fontSize: '1rem',
                                                background: '#f8f6f4',
                                                color: '#3c4c73',
                                                transition: 'all 0.3s ease',
                                                boxSizing: 'border-box'
                                            }, placeholder: "Enter your full name" })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: {
                                                display: 'block',
                                                marginBottom: '0.5rem',
                                                color: '#3c4c73',
                                                fontWeight: 500,
                                                fontSize: '0.95rem'
                                            }, children: "Email Address" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleInputChange, required: true, style: {
                                                width: '100%',
                                                padding: '0.875rem 1rem',
                                                borderRadius: 10,
                                                border: '2px solid rgba(126,90,117,0.2)',
                                                fontSize: '1rem',
                                                background: '#f8f6f4',
                                                color: '#3c4c73',
                                                transition: 'all 0.3s ease',
                                                boxSizing: 'border-box'
                                            }, placeholder: "Enter your email" })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: {
                                                display: 'block',
                                                marginBottom: '0.5rem',
                                                color: '#3c4c73',
                                                fontWeight: 500,
                                                fontSize: '0.95rem'
                                            }, children: "Password" }), _jsx("input", { type: "password", name: "password", value: formData.password, onChange: handleInputChange, required: true, style: {
                                                width: '100%',
                                                padding: '0.875rem 1rem',
                                                borderRadius: 10,
                                                border: '2px solid rgba(126,90,117,0.2)',
                                                fontSize: '1rem',
                                                background: '#f8f6f4',
                                                color: '#3c4c73',
                                                transition: 'all 0.3s ease',
                                                boxSizing: 'border-box'
                                            }, placeholder: "Create a password" })] }), _jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("label", { style: {
                                                display: 'block',
                                                marginBottom: '0.5rem',
                                                color: '#3c4c73',
                                                fontWeight: 500,
                                                fontSize: '0.95rem'
                                            }, children: "Confirm Password" }), _jsx("input", { type: "password", name: "confirmPassword", value: formData.confirmPassword, onChange: handleInputChange, required: true, style: {
                                                width: '100%',
                                                padding: '0.875rem 1rem',
                                                borderRadius: 10,
                                                border: '2px solid rgba(126,90,117,0.2)',
                                                fontSize: '1rem',
                                                background: '#f8f6f4',
                                                color: '#3c4c73',
                                                transition: 'all 0.3s ease',
                                                boxSizing: 'border-box'
                                            }, placeholder: "Confirm your password" })] }), _jsx("button", { type: "submit", disabled: isLoading, style: {
                                        width: '100%',
                                        padding: '0.875rem',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        opacity: isLoading ? 0.7 : 1,
                                        marginBottom: '1.5rem'
                                    }, children: isLoading ? 'Creating Account...' : 'Create Account' })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsxs("p", { style: {
                                        color: '#7e5a75',
                                        fontSize: '0.95rem',
                                        marginBottom: '0.5rem'
                                    }, children: ["Already have an account?", ' ', _jsx(Link, { to: "/login", style: {
                                                color: '#3c4c73',
                                                fontWeight: 600,
                                                textDecoration: 'none'
                                            }, children: "Sign in" })] }), _jsx(Link, { to: "/", style: {
                                        color: '#7e5a75',
                                        fontSize: '0.9rem',
                                        textDecoration: 'none',
                                        opacity: 0.8
                                    }, children: "\u2190 Back to home" })] })] })] }) }));
}
export default SignUp;
