import React, { useEffect, useState } from 'react';
import { useUser } from './App';
import axios from 'axios';
import { Link } from 'react-router-dom';

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

function Dashboard() {
  const { user } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      setError('');
      try {
        const res = await API.get(`/api/sessions/${user?.id}`);
        setSessions(res.data.sessions || []);
      } catch (err) {
        setError('Failed to load sessions.');
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchSessions();
  }, [user]);

  // Placeholder streak and usage logic
  const streak = 3; // TODO: calculate real streak from sessions
  const usageByDay = [
    { day: 'Mon', count: 1 },
    { day: 'Tue', count: 2 },
    { day: 'Wed', count: 1 },
    { day: 'Thu', count: 0 },
    { day: 'Fri', count: 2 },
    { day: 'Sat', count: 1 },
    { day: 'Sun', count: 0 },
  ];

  // Get language display info
  const getLanguageInfo = (code) => {
    const languages = {
      'es': { label: 'Spanish', flag: '🇪🇸' },
      'hi': { label: 'Hindi', flag: '🇮🇳' },
      'ja': { label: 'Japanese', flag: '🇯🇵' },
      'tl': { label: 'Tagalog', flag: '🇵🇭' },
      'ta': { label: 'Tamil', flag: '🇮🇳' },
      'ar': { label: 'Arabic', flag: '🇸🇦' },
      'zh': { label: 'Mandarin', flag: '🇨🇳' },
      'ko': { label: 'Korean', flag: '🇰🇷' }
    };
    return languages[code] || { label: code, flag: '🌍' };
  };

  const getProficiencyDisplay = (level) => {
    const levels = {
      'absolute-beginner': { label: 'Absolute Beginner', icon: '🌱' },
      'beginner': { label: 'Beginner', icon: '🌿' },
      'intermediate': { label: 'Intermediate', icon: '🌳' },
      'advanced': { label: 'Advanced', icon: '🏔️' },
      'heritage': { label: 'Heritage Speaker', icon: '🗝️' }
    };
    return levels[level] || { label: level, icon: '🌱' };
  };

  const languageInfo = user?.target_language ? getLanguageInfo(user.target_language) : null;
  const proficiencyInfo = user?.proficiency_level ? getProficiencyDisplay(user.proficiency_level) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f1ec 0%, #e8e0d8 50%, #d4c8c0 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(60,76,115,0.12)', padding: '2.5rem 2rem', marginBottom: '2rem' }}>
          <h1 style={{ color: '#3c4c73', fontFamily: 'Grandstander, Arial, sans-serif', fontWeight: 700, fontSize: '2rem', marginBottom: 8 }}>Welcome back, {user?.name?.split(' ')[0]}!</h1>
          {languageInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{languageInfo.flag}</span>
              <span style={{ color: '#7e5a75', fontSize: '1.1rem', fontWeight: 600 }}>Learning {languageInfo.label}</span>
              {proficiencyInfo && (
                <span style={{ color: '#7e5a75', fontSize: '0.9rem', opacity: 0.8 }}>({proficiencyInfo.label})</span>
              )}
            </div>
          )}
          <Link to={user?.target_language ? `/analyze?lang=${user.target_language}` : '/analyze'} style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #7e5a75 0%, #8a6a7a 100%)',
            color: '#fff',
            padding: '1rem 2rem',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(126,90,117,0.3)'
          }}>🎤 Start Practice Session</Link>
        </div>
        
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Streak Card */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔥</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#c38d94', marginBottom: '0.25rem' }}>{streak} days</div>
            <div style={{ color: '#7e5a75', fontSize: '0.9rem' }}>Current Streak</div>
          </div>
          
          {/* Progress Card */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#7e5a75', marginBottom: '0.25rem' }}>{sessions.length}</div>
            <div style={{ color: '#7e5a75', fontSize: '0.9rem' }}>Total Sessions</div>
          </div>
          
          {/* Goals Card */}
          {user?.learning_goals && user.learning_goals.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3c4c73', marginBottom: '0.25rem' }}>{user.learning_goals.length}</div>
              <div style={{ color: '#7e5a75', fontSize: '0.9rem' }}>Active Goals</div>
            </div>
          )}
        </div>
        {/* Weekly Usage Chart */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ color: '#7e5a75', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>📈 This Week's Practice</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 80 }}>
            {usageByDay.map(({ day, count }) => (
              <div key={day} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #c38d94 0%, #7e5a75 100%)', 
                  height: count * 20 + 8, 
                  width: 20, 
                  borderRadius: 8, 
                  margin: '0 auto 6px auto', 
                  transition: 'height 0.3s ease',
                  boxShadow: count > 0 ? '0 2px 8px rgba(126,90,117,0.3)' : 'none'
                }}></div>
                <div style={{ fontSize: '0.85rem', color: '#3c4c73', opacity: 0.7, fontWeight: 500 }}>{day}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Recent Sessions */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(60,76,115,0.1)', padding: '1.5rem' }}>
          <h2 style={{ color: '#7e5a75', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>💬 Recent Practice Sessions</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#7e5a75' }}>Loading sessions...</div>
          ) : error ? (
            <div style={{ color: '#dc3545', textAlign: 'center', padding: '2rem' }}>{error}</div>
          ) : sessions.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#7e5a75', 
              background: 'rgba(126,90,117,0.05)', 
              borderRadius: 12, 
              border: '2px dashed rgba(126,90,117,0.2)' 
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎤</div>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Ready for your first session?</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Start practicing to see your progress here!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.slice(0, 5).map(session => (
                <div key={session.id} style={{ 
                  background: 'rgba(126,90,117,0.05)', 
                  borderRadius: 12, 
                  padding: '1rem', 
                  border: '1px solid rgba(126,90,117,0.1)',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: '#3c4c73' }}>
                        {new Date(session.created_at).toLocaleDateString()} at {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {session.language && (
                        <div style={{ 
                          background: '#7e5a75', 
                          color: '#fff', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: 4, 
                          fontSize: '0.75rem', 
                          fontWeight: 600 
                        }}>
                          {session.language.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <Link 
                      to="/analyze" 
                      style={{ 
                        color: '#7e5a75', 
                        fontWeight: 600, 
                        textDecoration: 'none', 
                        fontSize: '0.9rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 6,
                        background: 'rgba(126,90,117,0.1)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Continue →
                    </Link>
                  </div>
                  <div style={{ color: '#7e5a75', fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                    {session.chat_history && session.chat_history.length > 0 ? (
                      <span>💬 {session.chat_history.length} messages exchanged</span>
                    ) : (
                      <span>📝 Practice session recorded</span>
                    )}
                  </div>
                  {session.chat_history && session.chat_history.length > 0 && (
                    <div style={{ 
                      background: 'rgba(126,90,117,0.08)', 
                      borderRadius: 8, 
                      padding: '0.75rem', 
                      marginTop: '0.5rem',
                      border: '1px solid rgba(126,90,117,0.1)'
                    }}>
                      <div style={{ fontWeight: 600, color: '#3c4c73', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                        Recent Conversation:
                      </div>
                      {session.chat_history.slice(-2).map((msg, idx) => (
                        <div key={idx} style={{ 
                          fontSize: '0.85rem', 
                          marginBottom: '0.25rem', 
                          color: msg.type === 'user' ? '#3c4c73' : '#7e5a75',
                          fontWeight: msg.type === 'user' ? 600 : 400
                        }}>
                          <span style={{ opacity: 0.7 }}>{msg.type === 'user' ? '👤' : '🤖'}</span> {msg.text?.slice(0, 80)}{msg.text?.length > 80 ? '...' : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {sessions.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <span style={{ color: '#7e5a75', fontSize: '0.9rem', opacity: 0.7 }}>And {sessions.length - 5} more sessions...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 