import posthog from 'posthog-js';

export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  if (typeof posthog !== 'undefined' && posthog.__loaded) {
    posthog.capture(event, properties);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, unknown>) => {
  if (typeof posthog !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, traits);
  }
};
