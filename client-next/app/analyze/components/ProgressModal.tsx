import React from 'react';
import { useRouter } from 'next/navigation';
import { LevelUpEvent } from '../../../lib/preferences';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressData: {
    percentages: number[];
    subgoalNames: string[];
    subgoalIds?: string[];
    levelUpEvents?: LevelUpEvent[];
  } | null;
}

const ProgressModal: React.FC<ProgressModalProps> = ({ isOpen, onClose, progressData }) => {
  const router = useRouter();

  if (!isOpen || !progressData) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--background)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header - Different messages based on level-ups */}
        {progressData.levelUpEvents && progressData.levelUpEvents.length > 0 ? (
          // Congratulations header for level-ups
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '0.3rem'
            }}>
              🎉
            </div>
            <div style={{
              color: 'var(--foreground)',
              fontSize: '1rem',
              fontWeight: 700,
              marginBottom: '0.3rem',
              fontFamily: 'Gabriela, Arial, sans-serif'
            }}>
              Congratulations! You've Leveled Up!
            </div>
            <div style={{
              color: 'var(--muted-foreground)',
              fontSize: '0.8rem',
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>
              Your hard work paid off! Here's what you achieved:
            </div>
          </div>
        ) : (
          // Keep practicing header for no level-ups
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.4rem'
            }}>
              📊
            </div>
            <div style={{
              color: 'var(--foreground)',
              fontSize: '1.1rem',
              fontWeight: 700,
              marginBottom: '0.4rem',
              fontFamily: 'Gabriela, Arial, sans-serif'
            }}>
              Keep Practicing!
            </div>
            <div style={{
              color: 'var(--muted-foreground)',
              fontSize: '0.85rem',
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}>
              Here's your current progress on your learning goals:
            </div>
          </div>
        )}
        
        {/* Progress Section - Enhanced styling */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(126,90,117,0.1) 0%, rgba(126,90,117,0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(126,90,117,0.2)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {progressData.percentages.map((percentage, index) => {
              // Check if this subgoal has a level up event
              const levelUpEvent = progressData.levelUpEvents?.find(event => 
                event.subgoalId === progressData.subgoalIds?.[index]
              );
              
              return (
                <div key={index} style={{
                  background: 'var(--card)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  border: levelUpEvent ? '1px solid rgba(126,90,117,0.3)' : '1px solid rgba(126,90,117,0.15)',
                  position: 'relative',
                  ...(levelUpEvent && {
                    background: 'linear-gradient(135deg, rgba(126,90,117,0.05) 0%, rgba(126,90,117,0.02) 100%)',
                    border: '1px solid rgba(126,90,117,0.3)'
                  })
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      background: levelUpEvent ? 'var(--rose-primary)' : 'var(--rose-accent)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      fontFamily: 'Montserrat, Arial, sans-serif'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{
                      color: 'var(--foreground)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      fontFamily: 'Gabriela, Arial, sans-serif'
                    }}>
                      {progressData.subgoalNames[index] || `Goal ${index + 1}`}
                    </div>
                    {levelUpEvent && (
                      <div style={{
                        background: 'var(--rose-primary)',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        fontFamily: 'Montserrat, Arial, sans-serif',
                        marginLeft: 'auto'
                      }}>
                        LEVEL UP!
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Section */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.3rem'
                    }}>
                      <div style={{
                        color: 'var(--muted-foreground)',
                        fontSize: '0.75rem',
                        fontFamily: 'Montserrat, Arial, sans-serif'
                      }}>
                        {levelUpEvent ? `Level ${levelUpEvent.oldLevel + 1} → Level ${levelUpEvent.newLevel + 1}` : 'Current Progress'}
                      </div>
                      <div style={{
                        color: 'var(--rose-primary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        fontFamily: 'Montserrat, Arial, sans-serif'
                      }}>
                        {levelUpEvent ? '100%' : Math.round(percentage) + '%'}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(126,90,117,0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--rose-primary) 0%, #8a6a7a 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.8s ease-in-out'
                      }} />
                    </div>
                  </div>
                  
                  {/* Level Transition for level up events */}
                  {levelUpEvent && (
                    <div style={{
                      background: 'rgba(126,90,117,0.05)',
                      borderRadius: '6px',
                      padding: '0.4rem',
                      border: '1px solid rgba(126,90,117,0.1)'
                    }}>
                      <div style={{
                        color: 'var(--muted-foreground)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        marginBottom: '0.3rem',
                        fontFamily: 'Montserrat, Arial, sans-serif'
                      }}>
                        New Challenge:
                      </div>
                      <div style={{
                        color: 'var(--foreground)',
                        fontSize: '0.75rem',
                        lineHeight: '1.2',
                        fontFamily: 'AR One Sans, Arial, sans-serif'
                      }}>
                        {levelUpEvent.newDescription}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Up Events */}
        {progressData.levelUpEvents && progressData.levelUpEvents.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              color: 'var(--foreground)',
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '1rem',
              textAlign: 'center',
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}>
              🚀 Level Up!
            </h3>
            {progressData.levelUpEvents.map((levelUpEvent, index) => (
              <div key={index} style={{
                backgroundColor: 'var(--muted)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.5rem',
                border: '1px solid rgba(126,90,117,0.1)'
              }}>
                <div style={{
                  color: 'var(--muted-foreground)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  fontFamily: 'Montserrat, Arial, sans-serif'
                }}>
                  New Challenge:
                </div>
                <div style={{
                  color: 'var(--foreground)',
                  fontSize: '0.75rem',
                  lineHeight: '1.2',
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }}>
                  {levelUpEvent.newDescription}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => {
              onClose();
              router.push('/dashboard');
            }}
            style={{
              padding: '0.6rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              background: 'var(--rose-primary)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              fontFamily: 'Montserrat, Arial, sans-serif',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--rose-primary) 0%, #8a6a7a 100%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--rose-primary)';
            }}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;


