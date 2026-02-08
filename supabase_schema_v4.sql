-- Admin audit log
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_email text,
  action text not null,
  target_user_id uuid,
  detail jsonb,
  created_at timestamptz default now()
);

alter table public.admin_audit enable row level security;

-- Only service role can access admin_audit
create policy "admin_audit_no_access" on public.admin_audit
  for all using (false);
