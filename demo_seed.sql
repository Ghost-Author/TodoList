-- Demo data seed
-- 1) Replace the USER_ID below with the demo user's auth.users id
-- 2) Run this in Supabase SQL editor

-- Example: select id from auth.users where email = 'demo@example.com';

-- >>> REPLACE THIS VALUE <<<
-- set user id here
-- e.g. 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

-- Use a SQL variable for clarity
DO $$
DECLARE
  uid uuid := '7e07191a-64e2-439e-9386-4fe64bd64aad';
BEGIN
  -- categories
  insert into public.categories (user_id, name)
  values
    (uid, '工作'),
    (uid, '生活'),
    (uid, '学习'),
    (uid, '健康'),
    (uid, '旅行')
  on conflict do nothing;

  -- tasks
  insert into public.tasks (user_id, text, note, due_date, priority, category, tags, completed)
  values
    (uid, '整理项目里程碑', '确认需求范围与时间线，和团队同步。', now()::date + 2, 'high', '工作', '{规划,协作}', false),
    (uid, '写周总结', '本周完成项 + 下周风险预警。', now()::date + 3, 'medium', '工作', '{复盘}', false),
    (uid, '晨间拉伸 10 分钟', '颈肩放松。', now()::date, 'low', '健康', '{运动}', false),
    (uid, '读完一章', '《产品思维》', now()::date + 5, 'medium', '学习', '{阅读}', false),
    (uid, '周末做一顿饭', '尝试新的菜谱。', now()::date + 4, 'low', '生活', '{放松}', false),
    (uid, '规划短途旅行', '列出行程与预算。', now()::date + 10, 'medium', '旅行', '{计划,出行}', false),
    (uid, '整理手机相册', '按月份归档。', null, 'none', '生活', '{整理}', false),
    (uid, '完成一节课程', 'React 状态管理。', now()::date + 6, 'medium', '学习', '{课程}', false),
    (uid, '清理邮箱', '删除不重要订阅。', now()::date + 1, 'low', '工作', '{整理}', false),
    (uid, '提前半小时睡觉', '从今晚开始。', now()::date, 'medium', '健康', '{习惯}', false);
END $$;
