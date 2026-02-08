# Supabase Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase_schema.sql`.
3. If you already deployed before, run `supabase_schema_v2.sql` to add tags.
4. Enable Email auth in Supabase Auth settings.
5. Add environment variables to Vercel and local `.env`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
ADMIN_SECRET=your_admin_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SENTRY_DSN=your_sentry_dsn
PASSWORD_RESET_REDIRECT=https://todo-list-one-puce-41.vercel.app
```

5. (Optional) If email confirmation is enabled, users must verify email before login.

Notes:
- Each user only sees their own tasks/categories due to RLS policies.
- Default categories are created automatically on first login.
- Admin summary endpoint requires `ADMIN_SECRET` and uses service role key. Never expose service role key to the client.
