-- Migration: add manual ordering for tasks
alter table public.tasks
  add column if not exists order_index int default 0;

-- Backfill order_index using created_at (newer first)
with ranked as (
  select id, row_number() over (partition by user_id order by created_at desc) as rn
  from public.tasks
)
update public.tasks t
set order_index = ranked.rn
from ranked
where t.id = ranked.id;
