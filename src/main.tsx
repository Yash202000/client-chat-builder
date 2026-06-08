import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import * as Sentry from "@sentry/react";
import posthog from 'posthog-js';
import App from './App.tsx'
import './index.css'
import './locales/i18n'

// Sentry init - only if DSN configured
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    environment: import.meta.env.MODE,
  });
}

// PostHog init - only if key configured
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false, // We'll use react-router integration
    persistence: 'localStorage',
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
