/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// TODO: This file should be split into Next.js pages and components.
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useUser } from '../ClientLayout';
import logo from '../../assets/logo.png';

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useUser();
  interface SignUpForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }
  const [formData, setFormData] = useState<SignUpForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailSignUp = async (e: FormEvent<HTMLFormElement>) => {
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
      // Use axios to call the Next.js API route
      const response = await axios.post('/api/auth/register', {
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
        router.push('/onboarding');
      } else {
        throw new Error('Registration response missing token or user');
      }
      
    } catch (err) {
      console.error('Sign-up error:', err);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorObj = err as { response?: { data?: { error?: string }, status?: number }, message?: string };
        setError(errorObj.response?.data?.error || errorObj.message || 'Sign-up failed. Please try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Sign-up failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError('');

    try {
      // Use axios to call the Next.js API route
      const response = await axios.post('/api/auth/google/token', {
        credential: credentialResponse.credential
      });
      
      console.log('Google signup response:', response.data);
      
      if (response.data.user && response.data.token) {
        localStorage.setItem('jwt', response.data.token);
        setUser(response.data.user);
        
        console.log('User onboarding_complete:', response.data.user.onboarding_complete);
        console.log('Boolean onboarding_complete:', Boolean(response.data.user.onboarding_complete));
        
        if (!Boolean(response.data.user.onboarding_complete)) {
          console.log('Redirecting to onboarding...');
          router.push('/onboarding');
        } else {
          console.log('Redirecting to dashboard...');
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError('Google sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-up failed. Please try again.');
  };

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
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(60,76,115,0.15)',
        maxWidth: 700,
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 100,
          height: 100,
          background: 'radial-gradient(circle, rgba(195,141,148,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 80,
          height: 80,
          background: 'radial-gradient(circle, rgba(126,90,117,0.1) 0%, transparent 70%)',
          borderRadius: '50%'
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '-0.9rem', display: 'flex', justifyContent: 'center' }}>
              <img src={logo.src} alt="BeyondWords Logo" style={{ height: '7rem', width: 'auto' }} />
            </div>
            <h1 style={{
              color: '#3c4c73',
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '0.1rem',
              fontFamily: 'Gabriela, Arial, sans-serif',
              letterSpacing: 1
            }}>
              Join BeyondWords
            </h1>
            <p style={{
              color: '#7e5a75',
              fontSize: '1rem',
              opacity: 0.8,
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>
              Start your speech journey today
            </p>
          </div>

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

          {/* Google Sign-Up */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ width: '100%' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text="signup_with"
                shape="rectangular"
                width="100%"
                auto_select={false}
                cancel_on_tap_outside={true}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              flex: 1,
              height: 1,
              background: 'rgba(126,90,117,0.2)'
            }}></div>
            <span style={{
              padding: '0 1rem',
              color: '#7e5a75',
              fontSize: '0.9rem',
              fontWeight: 500
            }}>
              or sign up with email
            </span>
            <div style={{
              flex: 1,
              height: 1,
              background: 'rgba(126,90,117,0.2)'
            }}></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#3c4c73',
                fontWeight: 500,
                fontSize: '0.95rem'
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: 10,
                  border: '2px solid rgba(126,90,117,0.2)',
                  fontSize: '1rem',
                  background: '#f8f6f4',
                  color: '#3c4c73',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your full name"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#3c4c73',
                fontWeight: 500,
                fontSize: '0.95rem'
              }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: 10,
                  border: '2px solid rgba(126,90,117,0.2)',
                  fontSize: '1rem',
                  background: '#f8f6f4',
                  color: '#3c4c73',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your email"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#3c4c73',
                fontWeight: 500,
                fontSize: '0.95rem'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: 10,
                  border: '2px solid rgba(126,90,117,0.2)',
                  fontSize: '1rem',
                  background: '#f8f6f4',
                  color: '#3c4c73',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Create a password"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#3c4c73',
                fontWeight: 500,
                fontSize: '0.95rem'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: 10,
                  border: '2px solid rgba(126,90,117,0.2)',
                  fontSize: '1rem',
                  background: '#f8f6f4',
                  color: '#3c4c73',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
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
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              color: '#7e5a75',
              fontSize: '0.95rem',
              marginBottom: '0.5rem'
            }}>
              Already have an account?{' '}
              <Link href="/login" style={{
                color: '#3c4c73',
                fontWeight: 600,
                textDecoration: 'none'
              }}>
                Log in
              </Link>
            </p>
            <Link href="/" style={{
              color: '#7e5a75',
              fontSize: '0.9rem',
              textDecoration: 'none',
              opacity: 0.8
            }}>
               Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 