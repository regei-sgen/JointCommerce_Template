import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

// BASE_URL is '/' locally and '/JointCommerce_Template/' on GitHub Pages (see vite.config.js).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');
// VITE_HASH_ROUTER=1 switches to #/ routes for static hosts without an SPA fallback.
const useHash = Boolean(import.meta.env.VITE_HASH_ROUTER);
const Router = useHash ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router basename={useHash ? undefined : basename}>
      <App />
    </Router>
  </React.StrictMode>
);
