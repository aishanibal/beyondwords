import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
const container = document.getElementById('root');
if (!container)
    throw new Error('Root container missing in index.html');
const root = ReactDOM.createRoot(container);
root.render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
