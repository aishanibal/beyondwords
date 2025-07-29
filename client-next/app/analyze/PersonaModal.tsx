import React from 'react';
import axios from 'axios';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (personaName: string) => Promise<void>;
  isSaving: boolean;
  currentTopics: string[];
  currentDescription: string;
  currentFormality: string;
}

export default function PersonaModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  currentTopics,
  currentDescription,
  currentFormality
}: PersonaModalProps) {
  const [personaName, setPersonaName] = React.useState('');

  const handleSave = async () => {
    if (!personaName.trim()) {
      alert('Please enter a persona name');
      return;
    }
    await onSave(personaName);
    setPersonaName('');
  };

  const handleClose = () => {
    setPersonaName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            color: 'var(--rose-primary)',
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            fontFamily: 'Gabriela, Arial, sans-serif'
          }}>
            🎭 Save Conversation Persona
          </h2>
          <p style={{
            color: '#666',
            fontSize: '0.9rem',
            lineHeight: 1.4
          }}>
            Create a reusable persona from this conversation to quickly start similar sessions in the future.
          </p>
        </div>

        {/* Current Settings Display */}
        <div style={{ 
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: 8,
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{
            color: '#495057',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
            fontFamily: 'Montserrat, Arial, sans-serif'
          }}>
            📋 Current Settings
          </h4>
          
          {/* Topics */}
          {currentTopics.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#6c757d',
                marginRight: '0.5rem'
              }}>
                Topics:
              </span>
              <span style={{
                fontSize: '0.8rem',
                color: '#495057',
                background: '#e9ecef',
                padding: '0.2rem 0.5rem',
                borderRadius: 4,
                marginRight: '0.25rem'
              }}>
                {currentTopics.join(', ')}
              </span>
            </div>
          )}

          {/* Formality */}
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#6c757d',
              marginRight: '0.5rem'
            }}>
              Formality:
            </span>
            <span style={{
              fontSize: '0.8rem',
              color: '#495057',
              background: '#e9ecef',
              padding: '0.2rem 0.5rem',
              borderRadius: 4
            }}>
              {currentFormality}
            </span>
          </div>

          {/* Description */}
          {currentDescription && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#6c757d',
                marginRight: '0.5rem'
              }}>
                Description:
              </span>
              <span style={{
                fontSize: '0.8rem',
                color: '#495057',
                background: '#e9ecef',
                padding: '0.2rem 0.5rem',
                borderRadius: 4
              }}>
                {currentDescription}
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 600,
            color: '#333',
            fontSize: '0.9rem'
          }}>
            Persona Name *
          </label>
          <input
            type="text"
            value={personaName}
            onChange={(e) => setPersonaName(e.target.value)}
            placeholder="e.g., Business Meeting, Casual Chat, Travel Guide"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: 8,
              fontSize: '0.9rem',
              fontFamily: 'AR One Sans, Arial, sans-serif'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            disabled={isSaving}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f8f9fa',
              color: '#6c757d',
              border: '1px solid #dee2e6',
              borderRadius: 8,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              opacity: isSaving ? 0.6 : 1
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !personaName.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: isSaving || !personaName.trim() ? '#ccc' : 'var(--rose-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: isSaving || !personaName.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              boxShadow: isSaving || !personaName.trim() ? 'none' : '0 2px 8px rgba(195,141,148,0.2)'
            }}
          >
            {isSaving ? '💾 Saving...' : '💾 Save Persona'}
          </button>
        </div>
      </div>
    </div>
  );
} 