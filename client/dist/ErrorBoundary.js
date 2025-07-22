import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }
    render() {
        var _a;
        if (this.state.hasError) {
            return (_jsxs("div", { style: {
                    minHeight: '100vh',
                    background: '#f5f1ec',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '2rem'
                }, children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '1rem' }, children: "\u26A0\uFE0F" }), _jsx("h1", { style: { color: '#3c4c73', fontSize: '1.5rem', fontWeight: 600, textAlign: 'center' }, children: "Something went wrong" }), _jsx("p", { style: { color: '#7e5a75', fontSize: '1rem', textAlign: 'center', maxWidth: '500px' }, children: "We encountered an unexpected error. Please refresh the page to try again." }), _jsx("button", { onClick: () => window.location.reload(), style: {
                            background: '#7e5a75',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }, children: "Refresh Page" }), process.env.NODE_ENV === 'development' && (_jsxs("details", { style: { marginTop: '2rem', maxWidth: '600px' }, children: [_jsx("summary", { style: { color: '#7e5a75', cursor: 'pointer' }, children: "Error Details" }), _jsx("pre", { style: {
                                    background: '#f8f6f4',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    overflow: 'auto',
                                    marginTop: '0.5rem'
                                }, children: (_a = this.state.error) === null || _a === void 0 ? void 0 : _a.toString() })] }))] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
