import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initSentry, Sentry } from './sentry.js';

const AdminApp = () => {
  const [secret, setSecret] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('summary');
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadSummary = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '请求失败');
      setData(json);
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (targetPage = 1) => {
    setError('');
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${targetPage}&per_page=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '请求失败');
      setUsers(json.users || []);
      setPage(targetPage);
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setUsersLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 pb-24">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <div className="card-soft p-8 mt-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#3b2e4a]">后台面板</h1>
          <p className="text-[#7b6f8c] mt-2">请输入管理员密钥以查看统计数据。</p>
          <div className="mt-6 flex gap-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin Secret"
              className="flex-1 text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
            />
            <button onClick={() => (tab === 'summary' ? loadSummary() : loadUsers(page))} className="btn-soft px-6 rounded-xl font-bold">
              {loading || usersLoading ? '加载中...' : '查看'}
            </button>
          </div>
          {error && <div className="mt-3 text-xs text-[#ff6fb1]">{error}</div>}

          <div className="mt-6 flex gap-2 text-xs font-bold">
            <button onClick={() => setTab('summary')} className={tab === 'summary' ? 'pill-soft px-3 py-1 rounded-full' : 'text-[#7b6f8c] hover:text-[#ff6fb1]'}>
              统计
            </button>
            <button onClick={() => setTab('users')} className={tab === 'users' ? 'pill-soft px-3 py-1 rounded-full' : 'text-[#7b6f8c] hover:text-[#ff6fb1]'}>
              用户列表
            </button>
          </div>

          {tab === 'summary' && data && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-[#ff6fb1]">{data.userCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">用户</div>
              </div>
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-[#ff6fb1]">{data.taskCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">任务</div>
              </div>
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-green-500">{data.completedCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已完成</div>
              </div>
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-[#ff6fb1]">{data.categoryCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分类</div>
              </div>
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-[#ff6fb1]">{data.activeCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">进行中</div>
              </div>
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-[#ff6fb1]">{data.overdueCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已逾期</div>
              </div>
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-[#ff6fb1]">{data.highPriorityCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">高优先级</div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3 text-xs text-[#7b6f8c]">
                <span>第 {page} 页</span>
                <div className="flex gap-2">
                  <button onClick={() => loadUsers(Math.max(page - 1, 1))} className="pill-soft px-3 py-1 rounded-full">上一页</button>
                  <button onClick={() => loadUsers(page + 1)} className="pill-soft px-3 py-1 rounded-full">下一页</button>
                </div>
              </div>
              <div className="card-soft-sm p-4 overflow-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[#7b6f8c]">
                    <tr>
                      <th className="py-2">邮箱</th>
                      <th className="py-2">创建时间</th>
                      <th className="py-2">最近登录</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#3b2e4a]">
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-[#ffe4f2]">
                        <td className="py-2">{u.email || '-'}</td>
                        <td className="py-2">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                        <td className="py-2">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                    {users.length === 0 && !usersLoading && (
                      <tr>
                        <td className="py-4 text-[#7b6f8c]" colSpan="3">暂无数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

initSentry();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="min-h-screen flex items-center justify-center text-[#7b6f8c]">后台出错了，请刷新重试。</div>}>
      <AdminApp />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
