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
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userTasks, setUserTasks] = useState([]);
  const [banReason, setBanReason] = useState('');

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

  const exportUsers = () => {
    const rows = users.map((u) => ({
      email: u.email || '',
      created_at: u.created_at || '',
      last_sign_in_at: u.last_sign_in_at || ''
    }));
    const header = ['email', 'created_at', 'last_sign_in_at'];
    const csv = [header.join(','), ...rows.map(r => header.map(k => `"${String(r[k]).replace(/\"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_page_${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const loadUserDetail = async (id) => {
    setDetailLoading(true);
    setResetLink('');
    setUserTasks([]);
    try {
      const res = await fetch(`/api/admin/user?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '请求失败');
      setUserDetail(json);
      const tasksRes = await fetch(`/api/admin/user_tasks?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        }
      });
      const tasksJson = await tasksRes.json();
      if (tasksRes.ok) setUserTasks(tasksJson.tasks || []);
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleBan = async (id, isBanned) => {
    setError('');
    try {
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        body: JSON.stringify({
          id,
          action: isBanned ? 'unban' : 'ban',
          reason: banReason,
          adminEmail: selectedUser?.email || null
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '请求失败');
      setUserDetail((prev) => prev ? { ...prev, ban_expires_at: json.ban_expires_at } : prev);
      setBanReason('');
    } catch (err) {
      setError(err.message || '请求失败');
    }
  };

  const resetPassword = async (email) => {
    setError('');
    setResetLink('');
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        body: JSON.stringify({ email, adminEmail: selectedUser?.email || null })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '请求失败');
      setResetLink(json.actionLink || '');
    } catch (err) {
      setError(err.message || '请求失败');
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
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 text-xs text-[#7b6f8c]">
                <span>第 {page} 页</span>
                <div className="flex gap-2">
                  <button onClick={() => loadUsers(Math.max(page - 1, 1))} className="pill-soft px-3 py-1 rounded-full">上一页</button>
                  <button onClick={() => loadUsers(page + 1)} className="pill-soft px-3 py-1 rounded-full">下一页</button>
                  <button onClick={exportUsers} className="pill-soft px-3 py-1 rounded-full">导出本页</button>
                </div>
              </div>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="搜索邮箱"
                className="mb-3 w-full text-xs bg-white/80 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
              />
              <div className="card-soft-sm p-4 overflow-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[#7b6f8c]">
                    <tr>
                      <th className="py-2">邮箱</th>
                      <th className="py-2">创建时间</th>
                      <th className="py-2">最近登录</th>
                      <th className="py-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#3b2e4a]">
                    {users.filter((u) => (u.email || '').toLowerCase().includes(userSearch.trim().toLowerCase())).map((u) => (
                      <tr key={u.id} className="border-t border-[#ffe4f2]">
                        <td className="py-2">{u.email || '-'}</td>
                        <td className="py-2">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                        <td className="py-2">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '-'}</td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              loadUserDetail(u.id);
                            }}
                            className="pill-soft px-3 py-1 rounded-full text-[10px] font-bold"
                          >
                            详情
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && !usersLoading && (
                      <tr>
                        <td className="py-4 text-[#7b6f8c]" colSpan="4">暂无数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
              <div className="card-soft w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#3b2e4a]">用户详情</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserDetail(null);
                      setResetLink('');
                    }}
                    className="text-[#ff9ccc]"
                  >
                    关闭
                  </button>
                </div>

                {detailLoading && <div className="text-sm text-[#7b6f8c]">加载中...</div>}
                {userDetail && (
                  <div className="space-y-3 text-sm text-[#7b6f8c]">
                    <div><span className="font-bold text-[#3b2e4a]">邮箱：</span>{userDetail.email || '-'}</div>
                    <div><span className="font-bold text-[#3b2e4a]">创建时间：</span>{userDetail.created_at ? new Date(userDetail.created_at).toLocaleString() : '-'}</div>
                    <div><span className="font-bold text-[#3b2e4a]">最近登录：</span>{userDetail.last_sign_in_at ? new Date(userDetail.last_sign_in_at).toLocaleString() : '-'}</div>
                    <div><span className="font-bold text-[#3b2e4a]">邮箱验证：</span>{userDetail.email_confirmed_at ? '已验证' : '未验证'}</div>
                    <div><span className="font-bold text-[#3b2e4a]">禁用状态：</span>{userDetail.ban_expires_at ? `已禁用（到 ${new Date(userDetail.ban_expires_at).toLocaleString()}）` : '正常'}</div>

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="禁用原因（可选）"
                        className="flex-1 text-xs bg-white/80 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                      />
                      <button
                        type="button"
                        onClick={() => toggleBan(userDetail.id, Boolean(userDetail.ban_expires_at))}
                        className="pill-soft px-3 py-1 rounded-full font-bold"
                      >
                        {userDetail.ban_expires_at ? '解禁' : '禁用'}
                      </button>
                      <button
                        type="button"
                        onClick={() => resetPassword(userDetail.email)}
                        className="pill-soft px-3 py-1 rounded-full font-bold"
                      >
                        重置密码
                      </button>
                    </div>

                    {resetLink && (
                      <div className="mt-2 text-xs">
                        <div className="text-[#3b2e4a] font-bold mb-1">重置链接（复制给用户）</div>
                        <div className="break-all bg-white/80 p-2 rounded-lg border border-[#ffe4f2]">{resetLink}</div>
                      </div>
                    )}

                    <div className="mt-3">
                      <div className="text-[#3b2e4a] font-bold mb-2">最近任务（20 条）</div>
                      <div className="card-soft-sm p-3 max-h-48 overflow-auto text-xs">
                        {userTasks.length === 0 && <div className="text-[#7b6f8c]">暂无任务</div>}
                        {userTasks.map((t) => (
                          <div key={t.id} className="py-2 border-b border-[#ffe4f2]">
                            <div className="font-bold text-[#3b2e4a]">{t.text}</div>
                            <div className="text-[#7b6f8c]">
                              {t.completed ? '已完成' : '进行中'} · {t.priority || '-'} · {t.category || '-'}
                              {t.due_date ? ` · 截止 ${t.due_date}` : ''}
                              {t.tags && t.tags.length > 0 ? ` · #${t.tags.join(' #')}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
