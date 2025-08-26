/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useUser } from '../ClientLayout';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUser();
  
  interface LoginForm {
    email: string;
    password: string;
  }
  
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // User will be set automatically by the auth state change listener
        // No need to manually set user here
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_token: credentialResponse.credential,
          },
        },
      });

      if (error) {
        throw error;
      }

      // User will be set automatically by the auth state change listener
      // No need to manually set user here
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '2rem',
      paddingTop: '1rem'
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
              <img 
                src="/favicon/favicon.svg" 
                alt="BeyondWords Logo" 
                style={{ 
                  height: '7rem', 
                  width: 'auto'
                }} 
              />
            </div>
            <h1 style={{
              color: '#3c4c73',
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '0.1rem',
              fontFamily: 'Gabriela, Arial, sans-serif',
              letterSpacing: 1
            }}>
              Welcome Back
            </h1>
            <p style={{
              color: '#7e5a75',
              fontSize: '1rem',
              opacity: 0.8,
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>
              Login to continue your speech journey
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

          {/* Google Login */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ width: '100%' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text="signin_with"
                shape="rectangular"
                auto_select={false}
                cancel_on_tap_outside={true}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1.5rem'
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
              or continue with email
            </span>
            <div style={{
              flex: 1,
              height: 1,
              background: 'rgba(126,90,117,0.2)'
            }}></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin}>
            <div style={{ marginBottom: '1rem' }}>
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
                  padding: '0.75rem 1rem',
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
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  border: '2px solid rgba(126,90,117,0.2)',
                  fontSize: '1rem',
                  background: '#f8f6f4',
                  color: '#3c4c73',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isLoading ? 0.7 : 1,
                marginBottom: '1rem'
              }}
            >
              {isLoading ? 'Logging In...' : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center' }}>
            <p style={{
              color: '#7e5a75',
              fontSize: '0.95rem',
              marginBottom: '0.5rem'
            }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{
                color: '#3c4c73',
                fontWeight: 600,
                textDecoration: 'none'
              }}>
                Sign up
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