# 云朵清单 (Cloud Todo)

一个轻柔可爱的待办清单应用，支持登录、分类、标签、搜索、排序、拖拽、后台管理与审计，并内置“如果不知道想干什么”的转盘决策功能。

## 功能亮点
- 邮箱登录/注册，忘记密码与重置
- 分类与标签、搜索、排序、拖拽手动排序
- 批量操作与撤销删除
- 转盘决策：分组管理、历史记录、一键创建任务
- 后台面板：统计、用户列表、禁用/解禁、重置密码、操作审计
- PWA/离线支持（网络优先，离线兜底）

## 技术栈
- Vite + React + Tailwind
- Supabase Auth + Postgres + RLS
- Vercel 部署

## 目录结构
```
api/                # Vercel Serverless Functions (后台管理)
public/             # 静态资源、PWA 文件
src/                # 前端源码
  components/       # 组件
  utils/            # 工具函数
  App.jsx           # 主应用
  admin.jsx         # 后台页面
```

## 本地运行
```bash
npm install
npm run dev
```

## 环境变量
在本地创建 `.env`（或 Vercel 环境变量）：
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_EMAILS=admin@example.com
ADMIN_SECRET=your_admin_secret
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PASSWORD_RESET_REDIRECT=https://your-domain.com
VITE_SENTRY_DSN=
```

## Supabase 初始化
1. 创建 Supabase 项目
2. SQL Editor 执行：
   - `supabase_schema.sql`
   - `supabase_schema_v2.sql`
   - `supabase_schema_v3.sql`
   - `supabase_schema_v4.sql`
   - `supabase_schema_v5.sql`（转盘基础表）
   - `supabase_schema_v6.sql`（转盘分组字段）
   - `supabase_schema_v7.sql`（转盘分组表）
   - `supabase_schema_v8.sql`（查询性能索引）

## Demo 数据
1. 先注册 demo 账号
2. 在 SQL Editor 查询 user id：
```sql
select id from auth.users where email = 'demo@example.com';
```
3. 替换 `demo_seed.sql` 中的 `REPLACE_WITH_USER_ID` 后执行

## 后台地址
- `https://your-domain.com/admin`
- 需要管理员邮箱（`VITE_ADMIN_EMAILS`）与 `ADMIN_SECRET`

## 部署到 Vercel
- 直接连接仓库部署
- 设置环境变量
- 支持 `admin.html` 多页面构建（`vercel.json` 已配置）

## 许可
MIT
