# Supabase Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase_schema.sql`.
3. Enable Email auth in Supabase Auth settings.
4. Add environment variables to Vercel and local `.env`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. (Optional) If email confirmation is enabled, users must verify email before login.

Notes:
- Each user only sees their own tasks/categories due to RLS policies.
- Default categories are created automatically on first login.
