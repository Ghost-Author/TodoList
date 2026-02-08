import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return null;
  if (Sentry.getClient()) return Sentry.getClient();

  return Sentry.init({
    dsn,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.1
  });
};

export { Sentry };
