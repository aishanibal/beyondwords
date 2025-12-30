import React from 'react';
import { motion } from 'framer-motion';
import { LEARNING_GOALS, LearningGoal } from '../../../lib/preferences';
import { getLanguageLabel } from '../types/analyze';

interface ConversationHeaderProps {
  isDarkMode: boolean;
  language: string;
  chatHistory: any[];
  userPreferences: any;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  isDarkMode,
  language,
  chatHistory,
  userPreferences
}) => {
  return (
    <div style={{ 
      padding: '0.75rem 1.25rem', 
      background: isDarkMode 
        ? 'linear-gradient(135deg, var(--muted) 0%, rgba(255,255,255,0.02) 100%)' 
        : 'linear-gradient(135deg, rgba(195,141,148,0.08) 0%, rgba(195,141,148,0.03) 100%)', 
      borderBottom: isDarkMode ? '1px solid var(--border)' : '1px solid rgba(195,141,148,0.15)', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      borderTopLeftRadius: 24, 
      borderTopRightRadius: 24,
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(195,141,148,0.1)'
    }}>
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '2.5rem',
        paddingRight: '2rem',
        paddingTop: '0.25rem',
        paddingBottom: '0.25rem',
        width: '100%'
      }}>
        {/* Main Title */}
        <div style={{ 
          color: isDarkMode ? '#e8b3c3' : 'var(--rose-primary)', 
          fontWeight: 700, 
          fontSize: '1.2rem', 
          fontFamily: 'Gabriela, Arial, sans-serif',
          transition: 'color 0.3s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {getLanguageLabel(language)} Practice Session
        </div>
        
        {/* Conversation Details Tags - Right Aligned */}
        {chatHistory.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            flexWrap: 'nowrap',
            justifyContent: 'flex-end',
            flex: 1,
            marginLeft: 'auto',
            overflowX: 'auto',
            overflowY: 'hidden',
            minWidth: 0
          }}>
            {/* Topics Tags (Scenario) - First */}
            {userPreferences?.topics?.map((topic: string, index: number) => (
              <motion.span 
                key={index} 
                style={{
                  background: isDarkMode ? 'rgba(196,181,253,0.15)' : 'rgba(132,84,109,0.1)',
                  color: isDarkMode ? 'var(--light-purple)' : 'var(--rose-primary)',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: isDarkMode ? '1px solid rgba(196,181,253,0.3)' : '1px solid rgba(132,84,109,0.2)',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(196,181,253,0.1)' : '0 2px 8px rgba(132,84,109,0.08)',
                  backdropFilter: 'blur(10px)',
                  display: 'inline-block',
                  flexShrink: 0,
                  cursor: 'pointer',
                  position: 'relative'
                }}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 1.2, 
                  delay: index * 0.25,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -2,
                  boxShadow: isDarkMode ? '0 4px 15px rgba(196,181,253,0.2)' : '0 4px 15px rgba(132,84,109,0.15)',
                  transition: { duration: 0.4 }
                }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.padding = '0.35rem 0.8rem';
                  e.currentTarget.innerHTML = `💬 ${topic}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.padding = '0.35rem 0.6rem';
                  e.currentTarget.innerHTML = '💬';
                }}
              >
                💬
              </motion.span>
            ))}
            
            {/* Formality Tag (Intimacy) - Second */}
            {userPreferences?.formality && (
              <motion.span 
                style={{
                  background: isDarkMode ? 'rgba(139,163,217,0.15)' : 'rgba(59,83,119,0.1)',
                  color: isDarkMode ? 'var(--blue-secondary)' : 'var(--blue-secondary)',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: isDarkMode ? '1px solid rgba(139,163,217,0.3)' : '1px solid rgba(59,83,119,0.2)',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  boxShadow: isDarkMode ? '0 2px 8px rgba(139,163,217,0.1)' : '0 2px 8px rgba(59,83,119,0.08)',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 1.2, 
                  delay: (userPreferences?.topics?.length || 0) * 0.25 + 0.3,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -2,
                  boxShadow: isDarkMode ? '0 4px 15px rgba(139,163,217,0.2)' : '0 4px 15px rgba(59,83,119,0.15)',
                  transition: { duration: 0.4 }
                }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.padding = '0.35rem 0.8rem';
                  e.currentTarget.innerHTML = `🎭 ${userPreferences.formality}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.padding = '0.35rem 0.6rem';
                  e.currentTarget.innerHTML = '🎭';
                }}
              >
                🎭
              </motion.span>
            )}
            
            {/* Learning Goals Tags (Learning Goal) - Third */}
            {userPreferences?.user_goals?.map((goalId: string, index: number) => {
              const goal = LEARNING_GOALS.find((g: LearningGoal) => g.id === goalId);
              return goal ? (
                <motion.span 
                  key={index} 
                  style={{
                    background: isDarkMode ? 'rgba(240,200,208,0.15)' : 'rgba(214,182,182,0.1)',
                    color: isDarkMode ? 'var(--rose-accent)' : 'var(--rose-accent)',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: isDarkMode ? '1px solid rgba(240,200,208,0.3)' : '1px solid rgba(214,182,182,0.2)',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                    boxShadow: isDarkMode ? '0 2px 8px rgba(240,200,208,0.1)' : '0 2px 8px rgba(214,182,182,0.08)',
                    backdropFilter: 'blur(10px)',
                    display: 'inline-block',
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 1.2, 
                    delay: ((userPreferences?.topics?.length || 0) + (userPreferences?.formality ? 1 : 0)) * 0.25 + index * 0.25 + 0.5,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    boxShadow: isDarkMode ? '0 4px 15px rgba(240,200,208,0.2)' : '0 4px 15px rgba(214,182,182,0.15)',
                    transition: { duration: 0.4 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.padding = '0.35rem 0.8rem';
                    e.currentTarget.innerHTML = `${goal.icon} ${goal.goal}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.padding = '0.35rem 0.6rem';
                    e.currentTarget.innerHTML = goal.icon;
                  }}
                >
                  {goal.icon}
                </motion.span>
              ) : null;
            })}
            
            {/* Selected Subgoals Tags - Fourth */}
            {userPreferences?.selected_subgoals?.map((subgoalId: string, index: number) => {
              // Find the parent goal and subgoal
              let subgoalDescription = '';
              let parentGoal: LearningGoal | undefined;
              for (const goal of LEARNING_GOALS) {
                const subgoal = goal.subgoals?.find(s => s.id === subgoalId);
                if (subgoal) {
                  subgoalDescription = subgoal.description;
                  parentGoal = goal;
                  break;
                }
              }
              if (!subgoalDescription) return null;
              
              // Truncate description for display
              const shortDescription = subgoalDescription.length > 40 
                ? subgoalDescription.substring(0, 40) + '...' 
                : subgoalDescription;
              
              return (
                <motion.span 
                  key={subgoalId} 
                  style={{
                    background: isDarkMode ? 'rgba(147,197,153,0.15)' : 'rgba(147,197,153,0.1)',
                    color: isDarkMode ? '#93C599' : '#4a8a50',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: isDarkMode ? '1px solid rgba(147,197,153,0.3)' : '1px solid rgba(147,197,153,0.2)',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Montserrat, Arial, sans-serif',
                    boxShadow: isDarkMode ? '0 2px 8px rgba(147,197,153,0.1)' : '0 2px 8px rgba(147,197,153,0.08)',
                    backdropFilter: 'blur(10px)',
                    display: 'inline-block',
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 1.2, 
                    delay: ((userPreferences?.topics?.length || 0) + (userPreferences?.formality ? 1 : 0) + (userPreferences?.user_goals?.length || 0)) * 0.25 + index * 0.25 + 0.6,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    boxShadow: isDarkMode ? '0 4px 15px rgba(147,197,153,0.2)' : '0 4px 15px rgba(147,197,153,0.15)',
                    transition: { duration: 0.4 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.padding = '0.35rem 0.8rem';
                    e.currentTarget.innerHTML = `📋 ${shortDescription}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.padding = '0.35rem 0.6rem';
                    e.currentTarget.innerHTML = '📋';
                  }}
                >
                  📋
                </motion.span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHeader;

