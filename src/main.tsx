import 'whatwg-fetch';
import 'fast-text-encoding';
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { RoomProvider } from './context/RoomContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// Previne tela branca após novos deploys na Vercel recarregando automaticamente quando um chunk antigo expirar
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RoomProvider>
        <App />
      </RoomProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
