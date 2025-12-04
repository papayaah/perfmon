import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { inject } from '@vercel/analytics';
import { App } from './app.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import './index.css';

// Initialize Vercel Analytics
inject();

function Root() {
  const [showApp, setShowApp] = useState(() => {
    // Check if user has visited before or if URL has #app hash
    if (typeof window !== 'undefined') {
      return window.location.hash === '#app' || localStorage.getItem('perfmon-visited') === 'true';
    }
    return false;
  });

  const handleGetStarted = () => {
    localStorage.setItem('perfmon-visited', 'true');
    window.location.hash = '#app';
    setShowApp(true);
  };

  const handleBackToLanding = () => {
    window.location.hash = '';
    setShowApp(false);
  };

  // Handle browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      setShowApp(window.location.hash === '#app');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (showApp) {
    return <App onBackToLanding={handleBackToLanding} />;
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}

render(<Root />, document.getElementById('app'));
