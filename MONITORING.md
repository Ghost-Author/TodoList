# Monitoring (Sentry)

1. Create a Sentry project (platform: React).
2. Copy the DSN.
3. Set `VITE_SENTRY_DSN` in Vercel and local `.env`.

Notes:
- Sentry is enabled only in production builds.
- Error boundaries are added for both the main app and admin panel.
