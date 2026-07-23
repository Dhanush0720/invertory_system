import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Register Service Worker for Progressive Web App (PWA) offline capability
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('PWA ServiceWorker registered successfully with scope: ', registration.scope);
      })
      .catch((err) => {
        console.error('PWA ServiceWorker registration failed: ', err);
      });
  });
} else if ('serviceWorker' in navigator && window.location.hostname === 'localhost') {
  // Register in local development as well so developer can test/install easily
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('PWA ServiceWorker (Local Development) registered successfully with scope: ', registration.scope);
      })
      .catch((err) => {
        console.error('PWA ServiceWorker (Local Development) registration failed: ', err);
      });
  });
}

