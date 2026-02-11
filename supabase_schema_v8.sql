-- Performance indexes for larger datasets
create index if not exists tasks_user_completed_idx
  on public.tasks (user_id, completed);

create index if not exists tasks_user_priority_completed_idx
  on public.tasks (user_id, priority, completed);

create index if not exists tasks_user_due_completed_idx
  on public.tasks (user_id, due_date, completed);

create index if not exists tasks_user_order_created_idx
  on public.tasks (user_id, order_index, created_at desc);

create index if not exists wheel_options_user_group_created_idx
  on public.wheel_options (user_id, group_name, created_at);

create index if not exists wheel_history_user_group_created_idx
  on public.wheel_history (user_id, group_name, created_at desc);

create index if not exists admin_audit_created_at_idx
  on public.admin_audit (created_at desc);
