import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';
import { inject } from '@vercel/analytics';
import { App } from './app.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import './index.css';

// Initialize Vercel Analytics
inject();

function Root() {
  return (
    <LocationProvider>
      <Router>
        <Route path="/" component={LandingPage} />
        <Route path="/app" component={App} />
        <Route default component={LandingPage} />
      </Router>
    </LocationProvider>
  );
}

render(<Root />, document.getElementById('app'));
