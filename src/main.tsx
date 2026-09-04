import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { TerminalProvider } from './context/TerminalContext';

// Swallow unhandled promise rejections or errors related to Firestore Quota Exceeded
// so they do not crash the React view
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && String(event.reason).includes('Quota exceeded')) {
    event.preventDefault();
    console.warn('Caught global Firestore Quota Exceeded error. Working offline/cached.');
  }
});

window.addEventListener('error', (event) => {
  if (event.error && String(event.error).includes('Quota exceeded')) {
    event.preventDefault();
    console.warn('Caught global Firestore Quota Exceeded error. Working offline/cached.');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TerminalProvider>
      <App />
    </TerminalProvider>
  </StrictMode>,
);
