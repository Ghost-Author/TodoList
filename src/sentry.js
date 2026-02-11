import React from 'react';

let externalSentry = null;
let loadingStarted = false;

class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // no-op fallback when Sentry SDK is unavailable
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

const loadSentrySdk = async () => {
  if (externalSentry || loadingStarted) return externalSentry;
  loadingStarted = true;
  try {
    const dynamicImport = new Function('m', 'return import(m)');
    const mod = await dynamicImport('@sentry/react');
    externalSentry = mod;
  } catch {
    externalSentry = null;
  }
  return externalSentry;
};

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || !import.meta.env.PROD) return null;

  void loadSentrySdk().then((mod) => {
    if (!mod) return;
    if (mod.getClient?.()) return;
    mod.init({
      dsn,
      enabled: true,
      tracesSampleRate: 0.1
    });
  });
  return null;
};

export const Sentry = {
  ErrorBoundary: ({ fallback, children }) => {
    const Boundary = externalSentry?.ErrorBoundary;
    if (Boundary) {
      return React.createElement(Boundary, { fallback }, children);
    }
    return React.createElement(LocalErrorBoundary, { fallback }, children);
  }
};
