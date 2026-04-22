import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { logDebug, logError, isDebugEnabled } from './lib/logger';

window.addEventListener('error', (event) => {
  logError('Unhandled runtime error', {
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
    error: event.error,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logError('Unhandled promise rejection', event.reason);
});

logDebug('Debug logging active', { debug: isDebugEnabled() });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
