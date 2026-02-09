-- Wheel groups
create table if not exists wheel_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create unique index if not exists wheel_groups_user_name_idx on wheel_groups(user_id, name);
create index if not exists wheel_groups_user_id_idx on wheel_groups(user_id);

alter table wheel_groups enable row level security;

create policy "wheel_groups_select_own" on wheel_groups
  for select using (auth.uid() = user_id);

create policy "wheel_groups_insert_own" on wheel_groups
  for insert with check (auth.uid() = user_id);

create policy "wheel_groups_update_own" on wheel_groups
  for update using (auth.uid() = user_id);

create policy "wheel_groups_delete_own" on wheel_groups
  for delete using (auth.uid() = user_id);
