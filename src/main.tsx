import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './app/styles/index.css';
import { logDebug, logError, isDebugEnabled } from './shared/lib/logger';
import { DataProvider } from './app/providers/DataProvider';
import { UIProvider } from './app/providers/UIProvider';

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
    <DataProvider>
      <UIProvider>
        <App />
      </UIProvider>
    </DataProvider>
  </StrictMode>,
);
