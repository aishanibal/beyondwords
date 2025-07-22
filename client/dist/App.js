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
import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';
import { saveWaitlistEmail } from './supabase';
import Analyze from './Analyze';
import Login from './Login';
import SignUp from './SignUp';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';
import Profile from './Profile';
import LanguageOnboarding from './LanguageOnboarding';
import ErrorBoundary from './ErrorBoundary';
import { FaUserCircle } from 'react-icons/fa'; // ESLint-compatible import at the top
// Translucent backgrounds for sections
const translucentBg = 'rgba(60,76,115,0.06)'; // subtle accent tint
const translucentRose = 'rgba(195,141,148,0.08)'; // subtle rose tint
const UserContext = createContext(undefined);
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
function useUser() {
    return useContext(UserContext);
}
function Logo() {
    return (_jsx("img", { src: "/favicon/favicon.svg", alt: "BeyondWords Logo", style: {
            height: '4.2rem',
            width: 'auto',
            marginRight: 12,
            verticalAlign: 'middle'
        } }));
}
function Navbar() {
    const { user, logout } = useUser();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownTimeout = useRef(null);
    // Handlers for dropdown to avoid inline functions in JSX
    const handleProfileMouseEnter = () => {
        if (dropdownTimeout.current)
            clearTimeout(dropdownTimeout.current);
        setShowDropdown(true);
    };
    const handleProfileMouseLeave = () => {
        dropdownTimeout.current = setTimeout(() => setShowDropdown(false), 150);
    };
    const handleProfileClick = () => navigate('/profile');
    const handleLogoutClick = () => __awaiter(this, void 0, void 0, function* () { yield logout(); });
    const handleTryItNow = () => {
        if (!user)
            navigate('/login');
        else
            navigate('/dashboard');
    };
    return (_jsxs("nav", { style: {
            background: '#f5f1ec',
            padding: '0.8rem 2rem',
            color: '#3e3e3e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(60,76,115,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center' }, children: [_jsx(Logo, {}), _jsx(Link, { to: "/", style: {
                            color: '#7e5a75',
                            fontWeight: 500,
                            fontSize: '1.5rem',
                            textDecoration: 'none',
                            letterSpacing: 1,
                            fontFamily: 'Grandstander, Arial, sans-serif',
                            transition: 'all 0.3s ease'
                        }, children: "BeyondWords" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx("button", { onClick: handleTryItNow, style: {
                            background: '#7e5a75',
                            color: '#f5f1ec',
                            textDecoration: 'none',
                            padding: '0.6rem 1.2rem',
                            borderRadius: 8,
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            marginRight: 8,
                            transition: 'all 0.3s ease',
                        }, children: user ? 'Dashboard' : 'Try It Now' }), user && (_jsxs("div", { style: { position: 'relative', display: 'inline-block' }, onMouseEnter: handleProfileMouseEnter, onMouseLeave: handleProfileMouseLeave, children: [_jsx("button", { style: {
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: 0
                                }, "aria-label": "Profile menu", type: "button", children: user.photoUrl ? (_jsx("img", { src: user.photoUrl, alt: "Profile avatar", style: { width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px #7e5a7533' } })) : (_jsx(FaUserCircle, { style: { fontSize: 38, color: '#7e5a75' } })) }), showDropdown && (_jsxs("div", { style: {
                                    position: 'absolute',
                                    top: 48,
                                    right: 0,
                                    background: '#fff',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 12,
                                    boxShadow: '0 4px 16px rgba(60,76,115,0.12)',
                                    minWidth: 160,
                                    zIndex: 1001,
                                    padding: '0.5rem 0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0
                                }, children: [_jsx("button", { onClick: handleProfileClick, style: {
                                            background: 'none',
                                            border: 'none',
                                            color: '#3c4c73',
                                            textAlign: 'left',
                                            padding: '0.75rem 1.5rem',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            width: '100%',
                                            borderBottom: '1px solid #f0f0f0',
                                            fontWeight: 500
                                        }, type: "button", children: "Profile / Settings" }), _jsx("button", { onClick: handleLogoutClick, style: {
                                            background: 'none',
                                            border: 'none',
                                            color: '#c38d94',
                                            textAlign: 'left',
                                            padding: '0.75rem 1.5rem',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            width: '100%',
                                            fontWeight: 500
                                        }, type: "button", children: "Log out" })] }))] })), user && user.role === 'admin' && _jsx(Link, { to: "/admin", style: {
                            color: '#7e5a75',
                            marginRight: 20,
                            textDecoration: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: 8,
                            transition: 'all 0.3s ease'
                        }, children: "Admin" }), !user && _jsx(Link, { to: "/login", style: {
                            color: '#7e5a75',
                            textDecoration: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: 8,
                            transition: 'all 0.3s ease'
                        }, children: "Login" })] })] }));
}
function Footer() {
    return (_jsxs("footer", { style: {
            background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 25%, #a67a8a 75%, #c38d94 100%)',
            color: '#f5f1ec',
            padding: '3rem 2rem 2rem 2rem',
            marginTop: '4rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
        }, children: [_jsx("div", { style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 20% 80%, rgba(245,241,236,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(195,141,148,0.1) 0%, transparent 50%)',
                    animation: 'float 6s ease-in-out infinite'
                } }), _jsxs("div", { style: { position: 'relative', zIndex: 1 }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }, children: _jsx("span", { style: {
                                fontSize: '1.5rem',
                                fontWeight: 500,
                                marginLeft: '0.5rem',
                                letterSpacing: 1,
                                fontFamily: 'Grandstander, Arial, sans-serif'
                            }, children: "BeyondWords" }) }), _jsx("p", { style: {
                            fontSize: '1rem',
                            marginBottom: '2rem',
                            opacity: 0.9,
                            maxWidth: '600px',
                            margin: '0 auto 2rem auto',
                            lineHeight: 1.6
                        }, children: "Our elders are growing older. Family stories are fading. Life's most meaningful moments are unfolding. This is the time to find your voice, before it feels too late." }), _jsx("div", { style: {
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '2rem',
                            marginBottom: '2rem',
                            flexWrap: 'wrap',
                            alignItems: 'center'
                        }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }, children: [_jsx("input", { type: "email", placeholder: "Your email address", style: {
                                        padding: '0.8rem 1rem',
                                        borderRadius: 8,
                                        border: '2px solid #7e5a75',
                                        fontSize: '1rem',
                                        fontFamily: 'AR One Sans',
                                        background: 'rgba(245,241,236,0.8)',
                                        color: '#3e3e3e',
                                        minWidth: 250,
                                    } }), _jsx("button", { onClick: () => __awaiter(this, void 0, void 0, function* () {
                                        const emailInput = document.querySelector('footer input[type="email"]');
                                        const email = emailInput === null || emailInput === void 0 ? void 0 : emailInput.value;
                                        if (!email || !email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
                                            alert('Please enter a valid email address.');
                                            return;
                                        }
                                        try {
                                            const result = yield saveWaitlistEmail(email, 'footer_form');
                                            if (result.success) {
                                                alert('Thank you for joining the waitlist! We\'ll be in touch soon.');
                                                if (emailInput)
                                                    emailInput.value = '';
                                            }
                                            else {
                                                alert('Failed to join waitlist. Please try again.');
                                            }
                                        }
                                        catch (error) {
                                            console.error('Waitlist error:', error);
                                            alert('Failed to join waitlist. Please try again.');
                                        }
                                    }), style: {
                                        background: '#7e5a75',
                                        color: '#f5f1ec',
                                        border: '2px solid #7e5a75',
                                        padding: '0.8rem 2rem',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        fontFamily: 'AR One Sans',
                                        transition: 'all 0.3s ease'
                                    }, children: "Join Waitlist" })] }) }), _jsx("div", { style: {
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '1rem',
                            flexWrap: 'wrap'
                        }, children: _jsx("a", { href: "https://forms.office.com/Pages/ResponsePage.aspx?id=RncIw6pRT0-Po3Vc1N8ikyownBfAaZ5Gk1xJwTt1Ik1UNVNGUllUMFJWNlBQRFVCQlJHSFZZUzZNWi4u", target: "_blank", rel: "noopener noreferrer", style: {
                                background: 'transparent',
                                color: '#f5f1ec',
                                border: '2px solid #f5f1ec',
                                padding: '0.8rem 2rem',
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontFamily: 'AR One Sans',
                                textDecoration: 'none',
                                display: 'inline-block',
                                transition: 'all 0.3s ease'
                            }, children: "Share Your Experience" }) })] })] }));
}
function Landing() {
    // Waitlist state
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const handleWaitlistSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        setError('');
        if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
            setError('Please enter a valid email address.');
            return;
        }
        try {
            const result = yield saveWaitlistEmail(email, 'hero_form');
            if (result.success) {
                setSubmitted(true);
                setEmail('');
            }
            else {
                setError('Failed to join waitlist. Please try again.');
            }
        }
        catch (error) {
            console.error('Waitlist error:', error);
            setError('Failed to join waitlist. Please try again.');
        }
    });
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: '#f5f1ec',
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontWeight: 900,
            color: '#3e3e3e',
            padding: 0,
            margin: 0,
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'center',
                    margin: '0 auto',
                    padding: '5rem 2rem 2rem 2rem',
                    gap: 'clamp(32px, 4vw, 64px)',
                    maxWidth: '1200px',
                    width: '100%',
                    flexWrap: 'wrap'
                }, children: [_jsxs("div", { style: {
                            flex: '1 1 400px',
                            minWidth: 320,
                            maxWidth: 600,
                            background: translucentBg,
                            borderRadius: 24,
                            boxShadow: '0 2px 12px #3c4c7322',
                            padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2vw, 2rem)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                        }, children: [_jsx("h1", { style: { fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 600, color: '#3c4c73', marginBottom: 18, lineHeight: 1.3, fontFamily: 'Grandstander, Arial, sans-serif' }, children: "Reconnect with Your Heritage Language" }), _jsx("p", { style: { fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', color: '#3e3e3e', lineHeight: 1.9, marginBottom: 32, maxWidth: 500, fontFamily: 'AR One Sans', fontWeight: 400 }, children: "An AI-powered tool designed for heritage speakers and diaspora communities to speak their native language with confidence, emotion, and pride." }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }, children: [_jsxs("form", { id: "waitlist", onSubmit: handleWaitlistSubmit, style: { display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }, children: [submitted ? (_jsx("div", { style: { color: '#3e3e3e', background: '#c38d94', padding: '0.7rem 1.2rem', borderRadius: 10, fontWeight: 600, marginBottom: 8 }, children: "Thank you for joining the waitlist!" })) : (_jsxs(_Fragment, { children: [_jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "Your email address", style: {
                                                            padding: '0.8rem 1rem',
                                                            borderRadius: 8,
                                                            border: '1.5px solid #c38d94',
                                                            fontSize: '1rem',
                                                            fontFamily: 'AR One Sans',
                                                            background: '#f5f1ec',
                                                            color: '#3e3e3e',
                                                            flex: '1 1 250px',
                                                            minWidth: 250,
                                                        }, required: true }), _jsx("button", { type: "submit", style: {
                                                            background: '#c38d94',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: 8,
                                                            padding: '0.8rem 2rem',
                                                            fontWeight: 600,
                                                            fontSize: '1rem',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 8px #c38d9422',
                                                            fontFamily: 'AR One Sans',
                                                            whiteSpace: 'nowrap',
                                                        }, children: "Join Waitlist" })] })), error && _jsx("div", { style: { color: '#b04a2b', fontSize: '0.95rem' }, children: error })] }), _jsx(Link, { to: "/analyze", style: {
                                            background: '#7e5a75',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '1rem 2rem',
                                            fontWeight: 600,
                                            fontSize: '1.1rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px #7e5a7533',
                                            fontFamily: 'AR One Sans',
                                            textDecoration: 'none',
                                            textAlign: 'center',
                                            display: 'inline-block',
                                            transition: 'all 0.3s ease'
                                        }, children: "\uD83C\uDFA4 Try It Now - Start Speaking" })] })] }), _jsx("div", { style: { flex: '1 1 350px', minWidth: 320, maxWidth: 400, display: 'flex', alignItems: 'stretch' }, children: _jsxs("div", { style: {
                                background: translucentRose,
                                borderRadius: 24,
                                boxShadow: '0 2px 16px #3c4c7333',
                                padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2vw, 2rem)',
                                width: '100%',
                                maxWidth: 400,
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease'
                            }, children: [_jsx(Logo, {}), _jsx("h2", { style: { color: '#7e5a75', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0.5rem 0 1rem 0', fontFamily: 'Grandstander, Arial, sans-serif', fontWeight: 700, letterSpacing: 1 }, children: "Share Your Experience" }), _jsx("p", { style: { fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', color: '#3e3e3e', lineHeight: 1.6, marginBottom: 24, fontFamily: 'AR One Sans', fontWeight: 400 }, children: "Do you understand your heritage language but struggle to speak it confidently?" }), _jsx("a", { href: "https://forms.office.com/Pages/ResponsePage.aspx?id=RncIw6pRT0-Po3Vc1N8ikyownBfAaZ5Gk1xJwTt1Ik1UNVNGUllUMFJWNlBQRFVCQlJHSFZZUzZNWi4u", target: "_blank", rel: "noopener noreferrer", style: {
                                        background: '#7e5a75',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '0.8rem 2rem',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px #7e5a7522',
                                        fontFamily: 'AR One Sans',
                                        textDecoration: 'none',
                                        display: 'inline-block',
                                        transition: 'all 0.3s ease'
                                    }, children: "Take Our Survey" })] }) })] }), _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 'clamp(16px, 2vw, 32px)',
                    margin: '36px auto 12px auto',
                    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                    fontWeight: 600,
                    letterSpacing: 1,
                    fontFamily: 'Grandstander, Arial, sans-serif',
                    color: '#3c4c73',
                    background: '#f5f1ec',
                    borderRadius: 0,
                    boxShadow: '0 2px 12px #3c4c7311',
                    padding: 'clamp(0.8rem, 2vw, 1.1rem) clamp(1.5rem, 3vw, 2.5rem)',
                    maxWidth: '1200px',
                    width: '100%',
                    flexWrap: 'wrap'
                }, children: [_jsx("span", { role: "img", "aria-label": "English", style: { fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginRight: 8 }, children: "\uD83C\uDDEC\uD83C\uDDE7" }), " English", _jsx("span", { role: "img", "aria-label": "Spanish", style: { fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 8px 0 clamp(16px, 2vw, 32px)' }, children: "\uD83C\uDDEA\uD83C\uDDF8" }), " Spanish", _jsx("span", { role: "img", "aria-label": "Tagalog", style: { fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 8px 0 clamp(16px, 2vw, 32px)' }, children: "\uD83C\uDDF5\uD83C\uDDED" }), " Tagalog", _jsx("span", { role: "img", "aria-label": "Hindi", style: { fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 8px 0 clamp(16px, 2vw, 32px)' }, children: "\uD83C\uDDEE\uD83C\uDDF3" }), " Hindi", _jsx("span", { role: "img", "aria-label": "Tamil", style: { fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 8px 0 clamp(16px, 2vw, 32px)' }, children: "\uD83C\uDDEE\uD83C\uDDF3" }), " Tamil"] }), _jsxs("div", { style: {
                    display: 'flex',
                    width: '100%',
                    maxWidth: '1200px',
                    justifyContent: 'center',
                    gap: 'clamp(32px, 4vw, 52px)',
                    margin: '0 auto',
                    marginTop: 32,
                    flexWrap: 'wrap',
                    padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2vw, 2rem)'
                }, children: [_jsx(FeatureCard, { icon: "\uD83E\uDD1D", title: "Conversational Practice", desc: "Chat naturally with AI to build fluency judgement-free.", noBorder: true, bg: translucentRose, textColor: "#7e5a75" }), _jsx(FeatureCard, { icon: "\uD83C\uDF31", title: "Detailed Feedback", desc: "Recieve personalized feedback on grammar, pronunciation, and cultural context.", noBorder: true, bg: translucentBg, textColor: "#3c4c73" }), _jsx(FeatureCard, { icon: "\uD83D\uDDDD\uFE0F", title: "On-the-Go Learning", desc: "Easily integrate your language into your daily life.", noBorder: true, bg: translucentRose, textColor: "#7e5a75" })] }), _jsx("div", { style: {
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '48px auto 0 auto',
                    padding: '0 clamp(1rem, 2vw, 2rem)'
                }, children: _jsx(Link, { to: "/analyze", style: {
                        background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 16,
                        padding: '1.2rem 3rem',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(126,90,117,0.4)',
                        fontFamily: 'Grandstander, Arial, sans-serif',
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'inline-block',
                        transition: 'all 0.3s ease',
                        letterSpacing: 1
                    }, children: "\uD83C\uDFA4 Start Your Conversation Now" }) }), _jsxs("div", { style: {
                    background: translucentBg,
                    borderRadius: 18,
                    margin: '48px auto 0 auto',
                    padding: 'clamp(1.5rem, 3vw, 2.2rem) clamp(1rem, 2vw, 2rem)',
                    maxWidth: '1200px',
                    width: '100%',
                    boxShadow: '0 1px 8px #3c4c7322',
                    textAlign: 'center',
                    fontFamily: 'AR One Sans'
                }, children: [_jsx("h2", { style: { color: '#7e5a75', fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)', marginBottom: 24, fontWeight: 500, fontFamily: 'Grandstander, Arial, sans-serif' }, children: "What Heritage Speakers Tell Us" }), _jsxs("div", { style: { display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 3vw, 32px)', flexWrap: 'wrap', marginBottom: 24 }, children: [_jsxs("div", { style: { flex: '1 1 300px', minWidth: 280, textAlign: 'left' }, children: [_jsx("h3", { style: { color: '#3c4c73', fontSize: 'clamp(1rem, 2vw, 1.2rem)', marginBottom: 16, fontWeight: 600, fontFamily: 'Grandstander, Arial, sans-serif' }, children: "What motivates you to speak your heritage language?" }), _jsx(SurveyResponse, { quote: "To keep my heritage alive. To communicate with my parents in public and in their native language. I want to be fluent for my own sake of being bilingual but not feeling fully confident in the second language.\n", name: "\u2014 Bengali Heritage Speaker" }), _jsx(SurveyResponse, { quote: "Everytime I come to the Philippines, there's a clear disconnect due to the language barrier, so I try to really hold on to the current Filipino knowledge I have and build on it.", name: "\u2014 Tagalog Heritage Speaker" }), _jsx(SurveyResponse, { quote: "I am motivated by seeing my families' smiles when I understand how important their language is. It is very unique and impactful how it reaches people like a warm embrace.\n", name: "\u2014 Bahamian Creole Heritage Speaker" })] }), _jsxs("div", { style: { flex: '1 1 300px', minWidth: 280, textAlign: 'left' }, children: [_jsx("h3", { style: { color: '#3c4c73', fontSize: 'clamp(1rem, 2vw, 1.2rem)', marginBottom: 16, fontWeight: 600, fontFamily: 'Grandstander, Arial, sans-serif' }, children: "What do you find helpful in a language tool?" }), _jsx(SurveyResponse, { quote: "Practicing conversations. With Malayalam, I just picked up the language and practiced by conversing. In Spanish class, we used to chat with people in Spanish Speaking countries and it forced me to think in the language which was good.\n", name: "\u2014 Malayalam Heritage Speaker" }), _jsx(SurveyResponse, { quote: "Being able to listen to my heritage language daily. Learning by someone who is proficient at the language.\n", name: "\u2014 Thai Heritage Speaker" }), _jsx(SurveyResponse, { quote: "I have mostly just absorbed from family and community since it is not very popular. There isn't really any other way to learn.\n", name: "\u2014 Jamaican Patois Heritage Speaker" })] })] })] }), _jsx(Footer, {}), _jsx("div", { style: {
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    zIndex: 1000,
                }, children: _jsxs("a", { href: "mailto:aishani.bal5@gmail.com,glennedelatorre@gmail.com", style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#7e5a75',
                        color: '#f5f1ec',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '1rem 1.5rem',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(126,90,117,0.3)',
                        fontFamily: 'AR One Sans',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease'
                    }, children: [_jsx("span", { style: { fontSize: '1.2rem' }, children: "\u2709\uFE0F" }), "Contact Us"] }) })] }));
}
function SurveyResponse({ quote, name }) {
    return (_jsxs("div", { style: { marginBottom: 20 }, children: [_jsxs("div", { style: { fontStyle: 'italic', color: '#3e3e3e', fontSize: '1rem', marginBottom: 8, lineHeight: 1.5 }, children: ["\"", quote, "\""] }), _jsx("div", { style: { color: '#7e5a75', fontWeight: 600, fontSize: '0.9rem' }, children: name })] }));
}
function FeatureCard({ icon, title, desc, noBorder, bg, textColor }) {
    // Only render icon if it's a string, number, or valid React element
    const renderIcon = typeof icon === 'string' || typeof icon === 'number' || React.isValidElement(icon)
        ? _jsx("div", { style: { fontSize: 'clamp(2rem, 4vw, 2.7rem)', marginBottom: 14 }, children: icon })
        : null;
    return (_jsxs("div", { style: {
            background: bg || 'transparent',
            borderRadius: 16,
            boxShadow: '0 2px 12px #3c4c7322',
            padding: 'clamp(1.5rem, 2vw, 2rem) clamp(1rem, 1.5vw, 1.7rem)',
            minWidth: 280,
            maxWidth: 380,
            flex: '1 1 300px',
            textAlign: 'center',
            fontFamily: 'AR One Sans',
            border: noBorder ? 'none' : undefined,
            color: textColor || (bg && (bg === '#3c4c73' || bg === '#7e5a75' || bg === '#c38d94') ? '#fff' : '#3e3e3e'),
        }, children: [renderIcon, _jsx("div", { style: { fontWeight: 700, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', marginBottom: 10 }, children: title }), _jsx("div", { style: { fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)', fontWeight: 400 }, children: desc })] }));
}
// Remove localStorage persistence for chatHistory - keep only in memory
// function useTemporaryChatHistory() {
//   const [chatHistory, setChatHistory] = useState([]);
//
//   // Simple wrapper function that only updates state
//   const updateChatHistory = useCallback((updater) => {
//     setChatHistory(prev => {
//       const newHistory = typeof updater === 'function' ? updater(prev) : updater;
//       return newHistory;
//     });
//   }, []);
//
//   return [chatHistory, updateChatHistory];
// }
function Admin() {
    const { user } = useUser();
    if (!user || user.role !== 'admin')
        return _jsx(Navigate, { to: "/" });
    return _jsx("div", { style: { padding: '2rem' }, children: "Admin Page (Edit conversational features here)" });
}
function RequireAuth({ children, requireOnboarding = false }) {
    const { user } = useUser();
    if (!user)
        return _jsx(Navigate, { to: "/login" });
    // Check if user has completed onboarding (handle both boolean and number from SQLite)
    const hasCompletedOnboarding = Boolean(user.onboarding_complete);
    // Only redirect to onboarding if user hasn't completed it AND it's required
    if (requireOnboarding && !hasCompletedOnboarding) {
        return _jsx(Navigate, { to: "/onboarding" });
    }
    // For non-onboarding routes, redirect incomplete users to onboarding
    if (!requireOnboarding && !hasCompletedOnboarding) {
        return _jsx(Navigate, { to: "/onboarding" });
    }
    return children;
}
function RedirectToDashboard({ children }) {
    const { user } = useUser();
    if (user) {
        const hasCompletedOnboarding = Boolean(user.onboarding_complete);
        if (!hasCompletedOnboarding) {
            return _jsx(Navigate, { to: "/onboarding" });
        }
        return _jsx(Navigate, { to: "/dashboard" });
    }
    return children;
}
function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError] = useState(false);
    useEffect(() => {
        console.log('App useEffect running...');
        const token = localStorage.getItem('jwt');
        console.log('Token from localStorage:', token ? 'exists' : 'none');
        // Set a fallback timeout to prevent infinite loading
        const fallbackTimeout = setTimeout(() => {
            console.warn('API call took too long, setting loading to false');
            setIsLoading(false);
        }, 5000); // 5 second timeout
        if (token) {
            console.log('Making API call to fetch user...');
            API.get('/api/user')
                .then(res => {
                console.log('User fetch successful:', res.data);
                clearTimeout(fallbackTimeout);
                setUser(res.data.user);
            })
                .catch((err) => {
                console.error('Failed to fetch user:', err);
                clearTimeout(fallbackTimeout);
                localStorage.removeItem('jwt');
                setUser(null);
            })
                .finally(() => {
                console.log('Setting isLoading to false');
                setIsLoading(false);
            });
        }
        else {
            console.log('No token, setting isLoading to false immediately');
            clearTimeout(fallbackTimeout);
            setIsLoading(false);
        }
        // Cleanup function
        return () => {
            clearTimeout(fallbackTimeout);
        };
    }, []);
    console.log('About to render - isLoading:', isLoading, 'user:', user);
    if (isLoading) {
        console.log('Rendering loading screen');
        return (_jsxs("div", { style: {
                minHeight: '100vh',
                background: '#f5f1ec',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1rem'
            }, children: [_jsx("div", { style: { fontSize: '2rem', marginBottom: '0.5rem' }, children: "\uD83D\uDDDD\uFE0F" }), _jsx("div", { style: { fontSize: '1.5rem', color: '#7e5a75', fontWeight: 600 }, children: "BeyondWords" }), _jsx("div", { style: { fontSize: '0.9rem', color: '#7e5a75', opacity: 0.7 }, children: "Loading your experience..." })] }));
    }
    console.log('Rendering main app structure');
    // Test if we can render a simple div first
    if (hasError) {
        return (_jsx("div", { style: {
                minHeight: '100vh',
                background: '#f5f1ec',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc3545'
            }, children: "Error in App component" }));
    }
    const logout = () => __awaiter(this, void 0, void 0, function* () {
        localStorage.removeItem('jwt');
        setUser(null);
        window.location.href = '/';
    });
    // Temporarily test without Google OAuth
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    console.log('Google Client ID:', googleClientId ? 'exists' : 'missing');
    return (_jsx(ErrorBoundary, { children: _jsx(GoogleOAuthProvider, { clientId: googleClientId || 'dummy-client-id', children: _jsx(UserContext.Provider, { value: { user, setUser, logout }, children: _jsxs(Router, { children: [_jsx(Navbar, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Landing, {}) }), _jsx(Route, { path: "/onboarding", element: _jsx(Onboarding, {}) }), _jsx(Route, { path: "/language-onboarding", element: _jsx(RequireAuth, { children: _jsx(LanguageOnboarding, { onComplete: () => { } }) }) }), _jsx(Route, { path: "/analyze", element: _jsx(RequireAuth, { requireOnboarding: true, children: _jsx(Analyze, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(Admin, {}) }), _jsx(Route, { path: "/login", element: _jsx(RedirectToDashboard, { children: _jsx(Login, {}) }) }), _jsx(Route, { path: "/signup", element: _jsx(RedirectToDashboard, { children: _jsx(SignUp, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(RequireAuth, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/profile", element: _jsx(RequireAuth, { children: _jsx(Profile, {}) }) })] })] }) }) }) }));
}
export default App;
export { useUser };
