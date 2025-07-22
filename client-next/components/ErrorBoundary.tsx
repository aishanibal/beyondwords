import React, { ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

type ErrorBoundaryProps = React.PropsWithChildren<{}>;

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#f5f1ec',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ color: '#3c4c73', fontSize: '1.5rem', fontWeight: 600, textAlign: 'center' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#7e5a75', fontSize: '1rem', textAlign: 'center', maxWidth: '500px' }}>
            We encountered an unexpected error. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#7e5a75',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '2rem', maxWidth: '600px' }}>
              <summary style={{ color: '#7e5a75', cursor: 'pointer' }}>Error Details</summary>
              <pre style={{ 
                background: '#f8f6f4', 
                padding: '1rem', 
                borderRadius: '8px', 
                fontSize: '0.8rem',
                overflow: 'auto',
                marginTop: '0.5rem'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;