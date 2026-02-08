-- Migration: add tags to tasks
alter table public.tasks
  add column if not exists tags text[] default '{}';

-- Optional: backfill null tags to empty array
update public.tasks set tags = '{}' where tags is null;
