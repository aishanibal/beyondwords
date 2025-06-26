import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { saveWaitlistEmail } from './supabase';

// Translucent backgrounds for sections
const translucentBg = 'rgba(60,76,115,0.06)'; // subtle accent tint
const translucentRose = 'rgba(195,141,148,0.08)'; // subtle rose tint

const UserContext = createContext();
const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001', 
  withCredentials: true 
});

function useUser() { return useContext(UserContext); }

function Logo() {
  // Placeholder logo: vintage key emoji
  return (
    <span style={{ fontSize: '2.2rem', marginRight: 12, verticalAlign: 'middle' }} role="img" aria-label="BeyondWords Key">🗝️</span>
  );
}

function Navbar() {
  const { user, logout } = useUser();
  return (
    <nav style={{ 
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
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Logo />
        <Link to="/" style={{ 
          color: '#7e5a75', 
          fontWeight: 500, 
          fontSize: '1.5rem', 
          textDecoration: 'none', 
          letterSpacing: 1,
          fontFamily: 'Grandstander, Arial, sans-serif',
          transition: 'all 0.3s ease',
          ':hover': {
            transform: 'scale(1.05)',
            textShadow: '0 0 20px rgba(126,90,117,0.3)'
          }
        }}>BeyondWords</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Temporarily hidden - uncomment when MVP is ready
        <Link to="/analyze" style={{ 
          color: '#7e5a75', 
          marginRight: 20,
          textDecoration: 'none',
          padding: '0.4rem 0.8rem',
          borderRadius: 8,
          transition: 'all 0.3s ease',
          ':hover': {
            background: 'rgba(126,90,117,0.1)',
            transform: 'translateY(-2px)'
          }
        }}>Analyze</Link>
        */}
        {user && user.role === 'admin' && <Link to="/admin" style={{ 
          color: '#7e5a75', 
          marginRight: 20,
          textDecoration: 'none',
          padding: '0.4rem 0.8rem',
          borderRadius: 8,
          transition: 'all 0.3s ease',
          ':hover': {
            background: 'rgba(126,90,117,0.1)',
            transform: 'translateY(-2px)'
          }
        }}>Admin</Link>}
        {user ? (
          null
        ) : (
          <Link to="/login" style={{ 
            color: '#7e5a75',
            textDecoration: 'none',
            padding: '0.4rem 0.8rem',
            borderRadius: 8,
            transition: 'all 0.3s ease',
            ':hover': {
              background: 'rgba(126,90,117,0.1)',
              transform: 'translateY(-2px)'
            }
          }}>Login</Link>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{
      background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 25%, #a67a8a 75%, #c38d94 100%)',
      color: '#f5f1ec',
      padding: '3rem 2rem 2rem 2rem',
      marginTop: '4rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(245,241,236,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(195,141,148,0.1) 0%, transparent 50%)',
        animation: 'float 6s ease-in-out infinite'
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 500, 
            marginLeft: '0.5rem',
            letterSpacing: 1,
            fontFamily: 'Grandstander, Arial, sans-serif'
          }}>BeyondWords</span>
        </div>
        
        <p style={{ 
          fontSize: '1rem', 
          marginBottom: '2rem', 
          opacity: 0.9,
          maxWidth: '600px',
          margin: '0 auto 2rem auto',
          lineHeight: 1.6
        }}>
          Our elders are growing older. Family stories are fading. Life's most meaningful moments are unfolding. This is the time to find your voice, before it feels too late.
        </p>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '2rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Your email address"
              style={{
                padding: '0.8rem 1rem',
                borderRadius: 8,
                border: '2px solid #7e5a75',
                fontSize: '1rem',
                fontFamily: 'AR One Sans',
                background: 'rgba(245,241,236,0.8)',
                color: '#3e3e3e',
                minWidth: 250,
              }}
            />
            <button 
              onClick={async () => {
                const emailInput = document.querySelector('footer input[type="email"]');
                const email = emailInput?.value;
                if (!email || !email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
                  alert('Please enter a valid email address.');
                  return;
                }
                try {
                  const result = await saveWaitlistEmail(email, 'footer_form');
                  if (result.success) {
                    alert('Thank you for joining the waitlist! We\'ll be in touch soon.');
                    emailInput.value = '';
                  } else {
                    alert('Failed to join waitlist. Please try again.');
                  }
                } catch (error) {
                  console.error('Waitlist error:', error);
                  alert('Failed to join waitlist. Please try again.');
                }
              }}
              style={{ 
                background: '#7e5a75',
                color: '#f5f1ec', 
                border: '2px solid #7e5a75',
                padding: '0.8rem 2rem',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: 'AR One Sans',
                transition: 'all 0.3s ease',
                ':hover': {
                  background: '#f5f1ec',
                  color: '#7e5a75',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Join Waitlist
            </button>
          </div>
          <a 
            href="https://forms.office.com/Pages/ResponsePage.aspx?id=RncIw6pRT0-Po3Vc1N8ikyownBfAaZ5Gk1xJwTt1Ik1UNVNGUllUMFJWNlBQRFVCQlJHSFZZUzZNWi4u" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              background: '#7e5a75',
              color: '#f5f1ec', 
              border: '2px solid #7e5a75',
              padding: '0.8rem 2rem',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: 'AR One Sans',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease',
              ':hover': {
                background: '#f5f1ec',
                color: '#7e5a75',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Share Your Experience
          </a>
        </div>
        
        <div style={{ 
          borderTop: '1px solid rgba(245,241,236,0.2)', 
          paddingTop: '1.5rem',
          fontSize: '0.9rem',
          opacity: 0.8
        }}>
          © 2024 BeyondWords.
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  // Waitlist state
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    try {
      const result = await saveWaitlistEmail(email, 'hero_form');
      if (result.success) {
        setSubmitted(true);
        setEmail('');
      } else {
        setError('Failed to join waitlist. Please try again.');
      }
    } catch (error) {
      console.error('Waitlist error:', error);
      setError('Failed to join waitlist. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f1ec',
      fontFamily: 'Montserrat, Arial, sans-serif',
      fontWeight: 900,
      color: '#3e3e3e',
      padding: 0,
      margin: 0,
    }}>
      {/* Hero Section */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        margin: '0 auto',
        padding: '5rem 2rem 2rem 2rem',
        gap: 'clamp(32px, 4vw, 64px)',
        maxWidth: '1200px',
        width: '100%',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
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
          transition: 'all 0.3s ease',
          ':hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 25px #3c4c7333'
          }
        }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 600, color: '#3c4c73', marginBottom: 18, lineHeight: 1.3, fontFamily: 'Grandstander, Arial, sans-serif' }}>Reconnect with Your Heritage Language</h1>
          <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', color: '#3e3e3e', lineHeight: 1.9, marginBottom: 32, maxWidth: 500, fontFamily: 'AR One Sans', fontWeight: 400 }}>
            An AI-powered tool designed for heritage speakers and diaspora communities to speak their native language with confidence, emotion, and pride.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            <form id="waitlist" onSubmit={handleWaitlistSubmit} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              {submitted ? (
                <div style={{ color: '#3e3e3e', background: '#c38d94', padding: '0.7rem 1.2rem', borderRadius: 10, fontWeight: 600, marginBottom: 8 }}>Thank you for joining the waitlist!</div>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Your email address"
                    style={{
                      padding: '0.8rem 1rem',
                      borderRadius: 8,
                      border: '1.5px solid #c38d94',
                      fontSize: '1rem',
                      fontFamily: 'AR One Sans',
                      background: '#f5f1ec',
                      color: '#3e3e3e',
                      flex: '1 1 250px',
                      minWidth: 250,
                    }}
                    required
                  />
                  <button type="submit" style={{
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
                    whiteSpace: 'nowrap',
                  }}>Join Waitlist</button>
                </>
              )}
              {error && <div style={{ color: '#b04a2b', fontSize: '0.95rem' }}>{error}</div>}
            </form>
          </div>
        </div>
        <div style={{ flex: '1 1 350px', minWidth: 320, maxWidth: 400, display: 'flex', alignItems: 'stretch' }}>
          <div style={{ 
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
            transition: 'all 0.3s ease',
            ':hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px #3c4c7333'
            }
          }}>
            <Logo />
            <h2 style={{ color: '#7e5a75', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0.5rem 0 1rem 0', fontFamily: 'Grandstander, Arial, sans-serif', fontWeight: 700, letterSpacing: 1 }}>Share Your Experience</h2>
            <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', color: '#3e3e3e', lineHeight: 1.6, marginBottom: 24, fontFamily: 'AR One Sans', fontWeight: 400 }}>
              Do you understand your heritage language but struggle to speak it confidently?
            </p>
            <a href="https://forms.office.com/Pages/ResponsePage.aspx?id=RncIw6pRT0-Po3Vc1N8ikyownBfAaZ5Gk1xJwTt1Ik1UNVNGUllUMFJWNlBQRFVCQlJHSFZZUzZNWi4u" target="_blank" rel="noopener noreferrer" style={{
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
              transition: 'all 0.3s ease',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 15px #7e5a7555'
              }
            }}>Take Our Survey</a>
          </div>
        </div>
      </div>

      {/* Language Flags Strip */}
      <div style={{
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
      }}>
        <span role="img" aria-label="English" style={{fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginRight: 8}}>🇬🇧</span> English
        <span role="img" aria-label="Spanish" style={{fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 8px 0 clamp(16px, 2vw, 32px)'}}>🇪🇸</span> Spanish
        <span role="img" aria-label="Tagalog" style={{fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 8px 0 clamp(16px, 2vw, 32px)'}}>🇵🇭</span> Tagalog
        <span role="img" aria-label="Hindi" style={{fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 8px 0 clamp(16px, 2vw, 32px)'}}>🇮🇳</span> Hindi
        <span role="img" aria-label="Tamil" style={{fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 8px 0 clamp(16px, 2vw, 32px)'}}>🇮🇳</span> Tamil
      </div>

      {/* Features Row */}
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        maxWidth: '1200px',
        justifyContent: 'center', 
        gap: 'clamp(32px, 4vw, 52px)', 
        margin: '0 auto', 
        marginTop: 32, 
        flexWrap: 'wrap', 
        padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(1rem, 2vw, 2rem)' 
      }}>
        <FeatureCard icon="🤝" title="Conversational Practice" desc="Chat naturally with AI to build fluency judgement-free." noBorder bg={translucentRose} textColor="#7e5a75" />
        <FeatureCard icon="🌱" title="Detailed Feedback" desc="Recieve personalized feedback on grammar, pronunciation, and cultural context." noBorder bg={translucentBg} textColor="#3c4c73" />
        <FeatureCard icon="🗝️" title="On-the-Go Learning" desc="Easily integrate your language into your daily life." noBorder bg={translucentRose} textColor="#7e5a75" />
      </div>

      {/* Survey Responses Section */}
      <div style={{ 
        background: translucentBg, 
        borderRadius: 18, 
        margin: '48px auto 0 auto', 
        padding: 'clamp(1.5rem, 3vw, 2.2rem) clamp(1rem, 2vw, 2rem)', 
        maxWidth: '1200px',
        width: '100%', 
        boxShadow: '0 1px 8px #3c4c7322', 
        textAlign: 'center', 
        fontFamily: 'AR One Sans' 
      }}>
        <h2 style={{ color: '#7e5a75', fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)', marginBottom: 24, fontWeight: 500, fontFamily: 'Grandstander, Arial, sans-serif' }}>What Heritage Speakers Tell Us</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 3vw, 32px)', flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ flex: '1 1 300px', minWidth: 280, textAlign: 'left' }}>
            <h3 style={{ color: '#3c4c73', fontSize: 'clamp(1rem, 2vw, 1.2rem)', marginBottom: 16, fontWeight: 600, fontFamily: 'Grandstander, Arial, sans-serif' }}>What motivates you to speak your heritage language?</h3>
            <SurveyResponse quote="To keep my heritage alive. To communicate with my parents in public and in their native language. I want to be fluent for my own sake of being bilingual but not feeling fully confident in the second language.
" name="— Bengali Heritage Speaker" />
            <SurveyResponse quote="Everytime I come to the Philippines, there's a clear disconnect due to the language barrier, so I try to really hold on to the current Filipino knowledge I have and build on it." name="— Tagalog Heritage Speaker" />
            <SurveyResponse quote="I am motivated by seeing my families' smiles when I understand how important their language is. It is very unique and impactful how it reaches people like a warm embrace.
" name="— Bahamian Creole Heritage Speaker" />
          </div>
          
          <div style={{ flex: '1 1 300px', minWidth: 280, textAlign: 'left' }}>
            <h3 style={{ color: '#3c4c73', fontSize: 'clamp(1rem, 2vw, 1.2rem)', marginBottom: 16, fontWeight: 600, fontFamily: 'Grandstander, Arial, sans-serif' }}>What do you find helpful in a language tool?</h3>
            <SurveyResponse quote="Practicing conversations. With Malayalam, I just picked up the language and practiced by conversing. In Spanish class, we used to chat with people in Spanish Speaking countries and it forced me to think in the language which was good.
" name="— Malayalam Heritage Speaker" />
            <SurveyResponse quote="Being able to listen to my heritage language daily. Learning by someone who is proficient at the language.
" name="— Thai Heritage Speaker" />
            <SurveyResponse quote="I have mostly just absorbed from family and community since it is not very popular. There isn't really any other way to learn.
" name="— Jamaican Patois Heritage Speaker" />
          </div>
        </div>
      </div>

      

      <Footer />
      
      {/* Contact Button Overlay */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000,
      }}>
        <a 
          href="mailto:aishani.bal5@gmail.com,glennedelatorre@gmail.com" 
          style={{
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
            transition: 'all 0.3s ease',
            ':hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 6px 25px rgba(126,90,117,0.4)',
              background: '#8a6a7a'
            }
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>✉️</span>
          Contact Us
        </a>
      </div>
    </div>
  );
}

function SurveyResponse({ quote, name }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontStyle: 'italic', color: '#3e3e3e', fontSize: '1rem', marginBottom: 8, lineHeight: 1.5 }}>
        "{quote}"
      </div>
      <div style={{ color: '#7e5a75', fontWeight: 600, fontSize: '0.9rem' }}>{name}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, noBorder, bg, textColor }) {
  // Only render icon if it's a string, number, or valid React element
  const renderIcon =
    typeof icon === 'string' || typeof icon === 'number' || React.isValidElement(icon)
      ? <div style={{ fontSize: 'clamp(2rem, 4vw, 2.7rem)', marginBottom: 14 }}>{icon}</div>
      : null;
  return (
    <div style={{
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
    }}>
      {renderIcon}
      <div style={{ fontWeight: 700, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)', fontWeight: 400 }}>{desc}</div>
    </div>
  );
}

// Add localStorage persistence for chatHistory
function usePersistentChatHistory(user) {
  const [chatHistory, setChatHistory] = useState(() => {
    if (!user) {
      const saved = localStorage.getItem('chatHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    if (!user) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } else {
      localStorage.removeItem('chatHistory');
    }
  }, [chatHistory, user]);

  return [chatHistory, setChatHistory];
}

function Analyze() {
  const { user } = useUser();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [chatHistory, setChatHistory] = usePersistentChatHistory(user);

  // Offer to save session when user logs in
  useEffect(() => {
    if (user && localStorage.getItem('chatHistory')) {
      setShowSavePrompt(true);
    }
  }, [user]);

  const saveSessionToBackend = async () => {
    try {
      await API.post('/api/save-session', { chatHistory });
      setShowSavePrompt(false);
      localStorage.removeItem('chatHistory');
      alert('Session saved to your account!');
    } catch (e) {
      alert('Failed to save session.');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setIsProcessing(true);
    
    // Add user message to chat
    const userMessage = { sender: 'User', text: '🎤 Recording...', timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('chatHistory', JSON.stringify(chatHistory));

      const response = await API.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update user message with transcription
      const transcription = response.data.transcription || 'Speech recorded';
      setChatHistory(prev => prev.map(msg => 
        msg === userMessage ? { ...msg, text: transcription } : msg
      ));

      // Add AI response
      if (response.data.aiResponse) {
        const aiMessage = { 
          sender: 'AI', 
          text: response.data.aiResponse, 
          timestamp: new Date() 
        };
        setChatHistory(prev => [...prev, aiMessage]);
      }

      // Play TTS audio if available
      if (response.data.ttsUrl) {
        const audio = new window.Audio(`http://localhost:3001${response.data.ttsUrl}`);
        audio.play();
      }

    } catch (error) {
      console.error('Error sending audio:', error);
      const errorMessage = { 
        sender: 'System', 
        text: '❌ Error processing audio. Please try again.', 
        timestamp: new Date() 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const requestDetailedFeedback = async () => {
    if (chatHistory.length === 0) {
      alert('Please record some speech first.');
      return;
    }

    setIsLoadingFeedback(true);
    try {
      const response = await API.post('/api/feedback', {
        chatHistory: chatHistory
      });
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error('Error requesting feedback:', error);
      setFeedback('❌ Error getting detailed feedback. Please try again.');
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', 
      background: '#f5f1ec',
      padding: '2rem'
    }}>
      <div style={{ flex: 1, background: '#fff', borderRadius: 20, marginRight: '1rem', display: 'flex', flexDirection: 'column', border: '2px solid #c38d94' }}>
        {/* Save session prompt */}
        {showSavePrompt && (
          <div style={{ background: '#fffbe6', border: '1px solid #c38d94', padding: 16, borderRadius: 8, margin: 16 }}>
            <p>You have an unsaved session. Save it to your account?</p>
            <button onClick={saveSessionToBackend} style={{ marginRight: 8 }}>Save</button>
            <button onClick={() => { setShowSavePrompt(false); localStorage.removeItem('chatHistory'); }}>Dismiss</button>
          </div>
        )}
        {/* Chat Header */}
        <div style={{ background: '#3c4c73', color: '#fff', padding: '1rem', borderRadius: '18px 18px 0 0', textAlign: 'center' }}>
          <h2>🎤 BeyondWords Chat</h2>
        </div>

        {/* Chat Messages */}
        <div style={{ 
          flex: 1, 
          padding: '1rem', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {chatHistory.map((message, index) => (
            <div key={index} style={{
              maxWidth: '80%',
              padding: '0.75rem 1rem',
              borderRadius: 18,
              alignSelf: message.sender === 'User' ? 'flex-end' : 'flex-start',
              background: message.sender === 'User' ? '#c38d94' : 
                         message.sender === 'AI' ? '#fff' : '#f5f1ec',
              color: message.sender === 'User' ? '#3e3e3e' : '#7e5a75',
              border: message.sender === 'AI' ? '1px solid #c38d94' : 'none',
              fontSize: '0.9rem'
            }}>
              {message.text}
            </div>
          ))}
          {isProcessing && (
            <div style={{
              alignSelf: 'center',
              padding: '0.5rem 1rem',
              background: '#f5f1ec',
              borderRadius: 12,
              color: '#7e5a75',
              fontSize: '0.9rem'
            }}>
              ⏳ Processing your speech...
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #c38d94',
          background: '#f5f1ec',
          borderRadius: '0 0 18px 18px',
          textAlign: 'center'
        }}>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: 'none',
              background: isRecording ? '#7e5a75' : '#c38d94',
              color: isRecording ? '#fff' : '#3e3e3e',
              fontSize: '24px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              animation: isRecording ? 'pulse 1.5s infinite' : 'none'
            }}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          <p style={{ marginTop: '0.5rem', color: '#7e5a75', fontSize: '0.9rem' }}>
            {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
          </p>
        </div>
      </div>

      {/* Feedback Section */}
      <div style={{ 
        width: 320, 
        background: '#f5f1ec', 
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #c38d94'
      }}>
        {/* Feedback Header */}
        <div style={{ 
          background: '#c38d94', 
          color: '#3e3e3e', 
          padding: '1rem', 
          borderRadius: '18px 18px 0 0',
          textAlign: 'center'
        }}>
          <h3>📊 Detailed Analysis</h3>
        </div>

        {/* Feedback Content */}
        <div style={{ 
          flex: 1, 
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button
            onClick={requestDetailedFeedback}
            disabled={isLoadingFeedback || chatHistory.length === 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#3c4c73',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: isLoadingFeedback ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              marginBottom: '1rem'
            }}
          >
            {isLoadingFeedback ? '⏳ Processing...' : 'Request Detailed Feedback'}
          </button>

          {feedback && (
            <div style={{
              background: '#fff',
              padding: '1rem',
              borderRadius: 8,
              border: '1px solid #c38d94',
              flex: 1,
              overflowY: 'auto',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}>
              {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Admin() {
  const { user } = useUser();
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return <div style={{ padding: '2rem' }}>Admin Page (Edit conversational features here)</div>;
}

function Login() {
  const { setUser } = useUser();
  
  const handleSuccess = async (credentialResponse) => {
    try {
      // Send the credential to your backend
      const response = await API.post('/auth/google/token', {
        credential: credentialResponse.credential
      });
      
      if (response.data.user) {
        setUser(response.data.user);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleError = () => {
    console.error('Login Failed');
  };

  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h2>Login with Google</h2>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
      />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    API.get('/api/user').then(res => setUser(res.data)).catch(() => setUser(null));
  }, []);
  
  const logout = async () => {
    await API.get('/api/logout');
    setUser(null);
    window.location.href = '/';
  };
  
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <UserContext.Provider value={{ user, setUser, logout }}>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            {/* Temporarily hidden - uncomment when MVP is ready
            <Route path="/analyze" element={<Analyze />} />
            */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Router>
      </UserContext.Provider>
    </GoogleOAuthProvider>
  );
}

export default App; 