-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

create unique index if not exists categories_user_name_idx
  on public.categories (user_id, name);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  text text not null,
  note text,
  due_date date,
  priority text,
  category text,
  completed boolean default false,
  created_at timestamptz default now()
);

create index if not exists tasks_user_created_idx
  on public.tasks (user_id, created_at desc);

alter table public.categories enable row level security;
alter table public.tasks enable row level security;

-- RLS policies
create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);

create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id);

create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);

create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id);

create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);
