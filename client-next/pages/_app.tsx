import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios, { InternalAxiosRequestConfig } from 'axios';
// import { saveWaitlistEmail } from '../lib/supabase'; // If needed, import from lib
import { FaUserCircle } from 'react-icons/fa';
import { usePathname } from 'next/navigation';

// Translucent backgrounds for sections
const translucentBg = 'rgba(60,76,115,0.06)'; // subtle accent tint
const translucentRose = 'rgba(195,141,148,0.08)'; // subtle rose tint

interface User {
  id?: string;
  role?: string;
  onboarding_complete?: boolean | number;
  photoUrl?: string;
  [key: string]: any;
}
interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
}
const UserContext = createContext<UserContextType | undefined>(undefined);

function useUser() {
  return useContext(UserContext) as UserContextType;
}

function Logo() {
  return (
    <img 
      src="/favicon/favicon.svg" 
      alt="BeyondWords Logo" 
      style={{ 
        height: '4.2rem', 
        width: 'auto', 
        marginRight: 12, 
        verticalAlign: 'middle' 
      }} 
    />
  );
}

function Navbar() {
  const { user, logout } = useUser();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handlers for dropdown to avoid inline functions in JSX
  const handleProfileMouseEnter = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setShowDropdown(true);
  };
  const handleProfileMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setShowDropdown(false), 150) as unknown as NodeJS.Timeout;
  };
  const handleProfileClick = () => router.push('/profile');
  const handleLogoutClick = async () => { await logout(); };

  const handleTryItNow = () => {
    if (!user) router.push('/login');
    else router.push('/dashboard');
  };
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
        <Link href="/" style={{ 
          color: '#7e5a75', 
          fontWeight: 500, 
          fontSize: '1.5rem', 
          textDecoration: 'none', 
          letterSpacing: 1,
          fontFamily: 'Grandstander, Arial, sans-serif',
          transition: 'all 0.3s ease'
        }}>BeyondWords</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={handleTryItNow} style={{
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
        }}>
          {user ? 'Dashboard' : 'Try It Now'}
        </button>
        {user && (
          <div
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={handleProfileMouseEnter}
            onMouseLeave={handleProfileMouseLeave}
          >
            <button
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                fontSize: 0
              }}
              aria-label="Profile menu"
              type="button"
            >
              {/* Use user photo if available, else generic icon */}
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="Profile avatar" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px #7e5a7533' }} />
              ) : (
                <FaUserCircle style={{ fontSize: 38, color: '#7e5a75' }} />
              )}
            </button>
            {showDropdown && (
              <div
                style={{
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
                }}
              >
                <button
                  onClick={handleProfileClick}
                  style={{
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
                  }}
                  type="button"
                >
                  Profile / Settings
                </button>
                <button
                  onClick={handleLogoutClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c38d94',
                    textAlign: 'left',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    width: '100%',
                    fontWeight: 500
                  }}
                  type="button"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
        {user && user.role === 'admin' && <Link href="/admin" style={{ 
          color: '#7e5a75', 
          marginRight: 20,
          textDecoration: 'none',
          padding: '0.4rem 0.8rem',
          borderRadius: 8,
          transition: 'all 0.3s ease'
        }}>Admin</Link>}
        {!user && <Link href="/login" style={{ 
          color: '#7e5a75',
          textDecoration: 'none',
          padding: '0.4rem 0.8rem',
          borderRadius: 8,
          transition: 'all 0.3s ease'
        }}>Login</Link>}
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
                const emailInput = document.querySelector('footer input[type="email"]') as HTMLInputElement | null;
                const email = emailInput?.value;
                if (!email || !email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
                  alert('Please enter a valid email address.');
                  return;
                }
                try {
                  // const result = await saveWaitlistEmail(email, 'footer_form'); // This line was removed
                  alert('Waitlist functionality is currently disabled.'); // Placeholder for waitlist logic
                  if (emailInput) emailInput.value = '';
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
                transition: 'all 0.3s ease'
              }}
            >
              Join Waitlist
            </button>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <a 
            href="https://forms.office.com/Pages/ResponsePage.aspx?id=RncIw6pRT0-Po3Vc1N8ikyownBfAaZ5Gk1xJwTt1Ik1UNVNGUllUMFJWNlBQRFVCQlJHSFZZUzZNWi4u" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
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
            }}
          >
            Share Your Experience
          </a>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  const { user } = useUser();
  const router = useRouter();
  // Waitlist state
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleWaitlistSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      alert('Waitlist functionality is currently disabled.');
      setSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Waitlist error:', error);
      setError('Failed to join waitlist. Please try again.');
    }
  };

  const handleTryItNow = () => {
    if (!user) {
      router.push('/login');
    } else if (!user.onboarding_complete) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
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
          transition: 'all 0.3s ease'
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
                  }}>Join Waitlist</button>
                </>
              )}
              {error && <div style={{ color: '#b04a2b', fontSize: '0.95rem' }}>{error}</div>}
            </form>
            <button onClick={handleTryItNow} style={{
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
            }}>🎤 Try It Now - Start Speaking</button>
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
            transition: 'all 0.3s ease'
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
              transition: 'all 0.3s ease'
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

      {/* Try It Now Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '48px auto 0 auto',
        padding: '0 clamp(1rem, 2vw, 2rem)'
      }}>
        <Link href="/analyze" style={{
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
        }}>🎤 Start Your Conversation Now</Link>
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
            transition: 'all 0.3s ease'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>✉️</span>
          Contact Us
        </a>
      </div>
    </div>
  );
}

interface SurveyResponseProps {
  quote: string;
  name: string;
}
function SurveyResponse({ quote, name }: SurveyResponseProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontStyle: 'italic', color: '#3e3e3e', fontSize: '1rem', marginBottom: 8, lineHeight: 1.5 }}>
        "{quote}"
      </div>
      <div style={{ color: '#7e5a75', fontWeight: 600, fontSize: '0.9rem' }}>{name}</div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  noBorder?: boolean;
  bg?: string;
  textColor?: string;
}
function FeatureCard({ icon, title, desc, noBorder, bg, textColor }: FeatureCardProps) {
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
  // TODO: Replace with Next.js middleware or useRouter push for auth redirects
  // if (!user || user.role !== 'admin') return <Navigate to="/" />;
  // Use useRouter().push('/') in useEffect if needed
  if (!user) return null;
  return <div style={{ padding: '2rem' }}>Admin Page (Edit conversational features here)</div>;
}

interface RequireAuthProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}
function RequireAuth({ children, requireOnboarding = false }: RequireAuthProps) {
  const { user } = useUser();
  // TODO: Replace with Next.js middleware or useRouter push for auth redirects
  // if (!user) return <Navigate to="/login" />;
  // Use useRouter().push('/login') in useEffect if needed
  if (!user) return null;
  
  // Check if user has completed onboarding (handle both boolean and number from SQLite)
  const hasCompletedOnboarding = Boolean(user.onboarding_complete);
  
  if (requireOnboarding && !hasCompletedOnboarding) {
    // TODO: Use useRouter().push('/onboarding')
    return null;
  }
  // For non-onboarding routes, redirect incomplete users to onboarding
  if (!requireOnboarding && !hasCompletedOnboarding) {
    // TODO: Use useRouter().push('/onboarding')
    return null;
  }
  return children;
}

interface RedirectToDashboardProps {
  children: React.ReactNode;
}
function RedirectToDashboard({ children }: RedirectToDashboardProps) {
  const { user } = useUser();
  // TODO: Use useRouter().push('/onboarding') or '/dashboard'
  if (user) return null;
  return children;
}

// Next.js _app.tsx convention: define MyApp to wrap all pages
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    if (token) {
      axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res: any) => {
          clearTimeout(fallbackTimeout);
          setUser(res.data.user);
          console.log('APP setUser called:', res.data.user);
        })
        .catch(() => {
          clearTimeout(fallbackTimeout);
          localStorage.removeItem('jwt');
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      clearTimeout(fallbackTimeout);
      setIsLoading(false);
    }
    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, []);

  // Redirect logic for onboarding
  // useEffect(() => {
  //   if (!isLoading && user) {
  //     const onboarded = Boolean(user.onboarding_complete);
  //     if (!onboarded && pathname !== '/onboarding') {
  //       router.push('/onboarding');
  //     } else if (onboarded && pathname === '/onboarding') {
  //       router.push('/dashboard');
  //     }
  //   }
  // }, [isLoading, user, pathname, router]);

  const logout = async () => {
    localStorage.removeItem('jwt');
    setUser(null);
    window.location.href = '/';
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f1ec',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗝️</div>
        <div style={{ fontSize: '1.5rem', color: '#7e5a75', fontWeight: 600 }}>BeyondWords</div>
        <div style={{ fontSize: '0.9rem', color: '#7e5a75', opacity: 0.7 }}>Loading your experience...</div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || 'dummy-client-id'}>
      <UserContext.Provider value={{ user, setUser, logout }}>
        <Navbar />
        <Component {...pageProps} />
      </UserContext.Provider>
    </GoogleOAuthProvider>
  );
}

export { useUser };
export default MyApp;

