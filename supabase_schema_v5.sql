-- Wheel options and history
create table if not exists wheel_options (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  label text not null,
  created_at timestamptz default now()
);

create index if not exists wheel_options_user_id_idx on wheel_options(user_id);

alter table wheel_options enable row level security;

create policy "wheel_options_select_own" on wheel_options
  for select using (auth.uid() = user_id);

create policy "wheel_options_insert_own" on wheel_options
  for insert with check (auth.uid() = user_id);

create policy "wheel_options_delete_own" on wheel_options
  for delete using (auth.uid() = user_id);

create table if not exists wheel_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  label text not null,
  created_at timestamptz default now()
);

create index if not exists wheel_history_user_id_idx on wheel_history(user_id);
create index if not exists wheel_history_created_at_idx on wheel_history(created_at);

alter table wheel_history enable row level security;

create policy "wheel_history_select_own" on wheel_history
  for select using (auth.uid() = user_id);

create policy "wheel_history_insert_own" on wheel_history
  for insert with check (auth.uid() = user_id);

create policy "wheel_history_delete_own" on wheel_history
  for delete using (auth.uid() = user_id);
