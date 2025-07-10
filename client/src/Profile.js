import React, { useState, useEffect } from 'react';
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
  
  // Form states
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
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
    setSuccess('');
  };


  const handleSave = async () => {
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

      const response = await API.put('/api/user/profile', requestData);

      console.log('Profile update response:', response.data);
      setUser(response.data.user);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };


  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)'
      }}>
        <div style={{ color: '#7e5a75', fontSize: '1.2rem' }}>Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(60,76,115,0.12)',
          padding: '2.5rem 2rem',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            color: '#3c4c73',
            fontFamily: 'Grandstander, Arial, sans-serif',
            fontWeight: 700,
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            ⚙️ Profile Settings
          </h1>
          <p style={{ color: '#7e5a75', fontSize: '1rem', margin: 0 }}>
            Manage your account information and learning preferences
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: 'rgba(220,53,69,0.1)',
            color: '#dc3545',
            padding: '1rem',
            borderRadius: 12,
            marginBottom: '2rem',
            border: '1px solid rgba(220,53,69,0.2)'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(40,167,69,0.1)',
            color: '#28a745',
            padding: '1rem',
            borderRadius: 12,
            marginBottom: '2rem',
            border: '1px solid rgba(40,167,69,0.2)'
          }}>
            {success}
          </div>
        )}

        {/* Personal Information */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(60,76,115,0.1)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: '#3c4c73',
            fontSize: '1.3rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            👤 Personal Information
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                color: '#3c4c73', 
                fontWeight: 600, 
                marginBottom: '0.5rem' 
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(126,90,117,0.2)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  background: '#f8f6f4',
                  color: '#3c4c73'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                color: '#3c4c73', 
                fontWeight: 600, 
                marginBottom: '0.5rem' 
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(126,90,117,0.2)',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  background: '#f8f6f4',
                  color: '#3c4c73'
                }}
              />
            </div>
          </div>
        </div>

        {/* Language Dashboard Info */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(60,76,115,0.1)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            color: '#3c4c73',
            fontSize: '1.3rem',
            fontWeight: 600,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📚 Language Learning Settings
          </h2>
          <p style={{ color: '#7e5a75', marginBottom: '1.5rem', fontSize: '1rem' }}>
            Language-specific settings like proficiency levels, topics, and goals are now managed in individual language dashboards. 
            You can access and edit these settings from your main dashboard.
          </p>
          <div style={{
            background: 'rgba(126,90,117,0.1)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid rgba(126,90,117,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <h3 style={{ color: '#3c4c73', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                Quick Access
              </h3>
            </div>
            <p style={{ color: '#7e5a75', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Go to your Dashboard to:
            </p>
            <ul style={{ color: '#7e5a75', fontSize: '0.9rem', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
              <li>Switch between language dashboards</li>
              <li>Add new languages to learn</li>
              <li>Edit proficiency levels and learning goals</li>
              <li>Manage conversation topics for each language</li>
            </ul>
            <a 
              href="/dashboard" 
              style={{
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
              }}
            >
              Go to Dashboard →
            </a>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
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
            }}
          >
            {isSaving ? '💾 Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;