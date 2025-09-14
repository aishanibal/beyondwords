import React from 'react';
import logo from '../../assets/logo.png';

export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f1ec 0%, #f8f9fa 50%, #f5f1ec 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'Montserrat, Arial, sans-serif'
    }}>
      <div style={{ 
        marginBottom: '1rem'
      }}>
        <img 
          src={logo.src} 
          alt="BeyondWords Logo" 
          style={{
            width: '80px',
            height: '80px',
            objectFit: 'contain'
          }}
        />
      </div>
      <div style={{ 
        fontSize: '1.5rem', 
        color: '#7e5a75', 
        fontWeight: 600,
        marginBottom: '0.5rem'
      }}>
        BeyondWords
      </div>
      <div style={{ 
        fontSize: '0.9rem', 
        color: '#7e5a75', 
        opacity: 0.7 
      }}>
        {message}
      </div>
    </div>
  );
} 