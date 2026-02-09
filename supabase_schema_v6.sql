-- Add group name for wheel options/history
alter table wheel_options
  add column if not exists group_name text default '随机';

update wheel_options set group_name = '随机' where group_name is null;

alter table wheel_history
  add column if not exists group_name text default '随机';

update wheel_history set group_name = '随机' where group_name is null;
