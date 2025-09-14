'use client';
import React, { useEffect, useState } from 'react';
import { useUser } from '../../ClientLayout';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useDarkMode } from '../../contexts/DarkModeContext';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
  preferences?: {
    notifications_enabled: boolean;
    email_notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useUser();
  const { isDarkMode, setTheme, syncWithUserPreferences } = useDarkMode();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    notifications_enabled: true,
    email_notifications: true,
    theme: 'light' as 'light' | 'dark' | 'auto',
    language: 'en'
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    async function fetchProfile() {
      try {
        const token = localStorage.getItem('jwt');
        const response = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const userProfile = response.data.user; // Backend returns { user }
        setProfile(userProfile);
        
        // Parse name into first and last name
        const nameParts = userProfile.name ? userProfile.name.split(' ') : ['', ''];
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';
        
        setFormData({
          first_name: first_name,
          last_name: last_name,
          notifications_enabled: userProfile.preferences?.notifications_enabled ?? true,
          email_notifications: userProfile.preferences?.email_notifications ?? true,
          theme: userProfile.preferences?.theme || 'light',
          language: userProfile.preferences?.language || 'en'
        });
        
        // Set theme based on user preference
        const theme = userProfile.preferences?.theme || 'light';
        syncWithUserPreferences(theme);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data.' });
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setFormData(prev => ({ ...prev, theme: newTheme }));
    setTheme(newTheme);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('jwt');
      await axios.put('/api/user/profile', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: profile?.email || '',
        preferences: {
          notifications_enabled: formData.notifications_enabled,
          email_notifications: formData.email_notifications,
          theme: formData.theme,
          language: formData.language
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('jwt');
      await axios.delete('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-rose-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-cream'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-heading font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-rose-primary'}`}>Profile Settings</h1>
          <p className={`font-body ${isDarkMode ? 'text-gray-300' : 'text-rose-accent'}`}>Manage your account preferences and personal information</p>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
                                     <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-lg shadow-lg p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
              <h2 className={`text-2xl font-heading font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-rose-primary'}`}>Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-rose-accent'}`}>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-rose-accent/30'
                    }`}
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-rose-accent'}`}>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-rose-accent/30'
                    }`}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-rose-accent'}`}>Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className={`w-full px-3 py-2 border rounded-lg cursor-not-allowed transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-400' 
                      : 'border-rose-accent/30 bg-gray-50 text-gray-500'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-rose-accent/60'}`}>Email cannot be changed</p>
              </div>
            </motion.div>

            {/* Preferences */}
                                     <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-lg shadow-lg p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
              <h2 className={`text-2xl font-heading font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-rose-primary'}`}>Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-rose-accent'}`}>Push Notifications</label>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-rose-accent/60'}`}>Receive notifications about your progress</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="notifications_enabled"
                      checked={formData.notifications_enabled}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-primary ${
                      isDarkMode ? 'bg-gray-600' : 'bg-rose-accent/30'
                    }`}></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-rose-accent'}`}>Email Notifications</label>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-rose-accent/60'}`}>Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="email_notifications"
                      checked={formData.email_notifications}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-primary ${
                      isDarkMode ? 'bg-gray-600' : 'bg-rose-accent/30'
                    }`}></div>
                  </label>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-rose-accent'}`}>Theme</label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'auto')}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'border-rose-accent/30'
                    }`}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-rose-accent'}`}>Interface Language</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-primary focus:border-transparent transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'border-rose-accent/30'
                    }`}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-end"
            >
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-rose-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-rose-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
                                     <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-lg shadow-lg p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
              <h3 className={`text-lg font-heading font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-rose-primary'}`}>Account Information</h3>
              
                              <div className="space-y-3 text-sm">
                  <div>
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-rose-accent/60'}`}>Member since:</span>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-rose-primary'}`}>
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-rose-accent/60'}`}>User ID:</span>
                    <p className={`font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-rose-primary'}`}>{profile?.id || 'N/A'}</p>
                  </div>
                </div>
            </motion.div>

            {/* Danger Zone */}
                                     <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-lg shadow-lg p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-red-800' : 'bg-white border border-red-200'}`}
            >
              <h3 className="text-lg font-heading font-semibold text-red-600 mb-4">Danger Zone</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-2">Delete Account</h4>
                  <p className="text-xs text-red-500 mb-3">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 