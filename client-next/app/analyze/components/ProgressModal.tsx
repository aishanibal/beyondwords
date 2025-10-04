import React from 'react';
import { useRouter } from 'next/navigation';
import { LevelUpEvent } from '../../../lib/preferences';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressData: {
    percentages: number[];
    subgoalNames: string[];
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
        <h2 style={{
          color: 'var(--foreground)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontFamily: 'Montserrat, Arial, sans-serif'
        }}>
          🎉 Progress Update!
        </h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          {progressData.percentages.map((percentage, index) => (
            <div key={index} style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  color: 'var(--foreground)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: 'AR One Sans, Arial, sans-serif'
                }}>
                  {progressData.subgoalNames[index] || `Goal ${index + 1}`}
                </span>
                <span style={{
                  color: 'var(--rose-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  fontFamily: 'Montserrat, Arial, sans-serif'
                }}>
                  {Math.round(percentage)}%
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--muted)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: 'var(--rose-primary)',
                  borderRadius: '4px',
                  transition: 'width 0.8s ease-in-out'
                }} />
              </div>
            </div>
          ))}
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


