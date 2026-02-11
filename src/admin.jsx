import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initSentry, Sentry } from './sentry.js';
import { createAdminClient } from './utils/adminApi.js';
import SummaryCards from './admin-components/SummaryCards.jsx';
import UsersTable from './admin-components/UsersTable.jsx';
import AuditTable from './admin-components/AuditTable.jsx';
import UserDetailModal from './admin-components/UserDetailModal.jsx';

const AdminApp = () => {
  const [secret, setSecret] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('summary');
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(null);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [usersQuery, setUsersQuery] = useState('');
  const [userTasks, setUserTasks] = useState([]);
  const [banReason, setBanReason] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [requestId, setRequestId] = useState('');

  const handleRequestError = (err) => {
    const message = err?.message || '请求失败';
    setError(message);
    const matched = message.match(/request_id:\s*([^)]+)/i);
    setRequestId(matched?.[1]?.trim() || '');
  };

  const loadSummary = async () => {
    setError('');
    setRequestId('');
    setLoading(true);
    try {
      const api = createAdminClient(secret);
      const json = await api.getSummary();
      setData(json);
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (targetPage = 1, targetQuery = usersQuery) => {
    setError('');
    setRequestId('');
    setUsersLoading(true);
    try {
      const api = createAdminClient(secret);
      const json = await api.getUsers(targetPage, 20, targetQuery);
      setUsers(json.users || []);
      setPage(targetPage);
      setUsersTotal(Number.isFinite(json.total) ? json.total : null);
      setUsersHasMore(Boolean(json.has_more));
    } catch (err) {
      handleRequestError(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const applyUserSearch = async () => {
    const q = userSearch.trim();
    setUsersQuery(q);
    await loadUsers(1, q);
  };

  const clearUserSearch = async () => {
    setUserSearch('');
    setUsersQuery('');
    await loadUsers(1, '');
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

  const loadAudit = async (targetPage = 1) => {
    setError('');
    setRequestId('');
    setAuditLoading(true);
    try {
      const api = createAdminClient(secret);
      const json = await api.getAudit(targetPage, 20);
      setAuditLogs(json.logs || []);
      setAuditPage(targetPage);
    } catch (err) {
      handleRequestError(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadUserDetail = async (id) => {
    setDetailLoading(true);
    setResetLink('');
    setUserTasks([]);
    setRequestId('');
    try {
      const api = createAdminClient(secret);
      const json = await api.getUser(id);
      setUserDetail(json);
      const tasksJson = await api.getUserTasks(id);
      setUserTasks(tasksJson.tasks || []);
    } catch (err) {
      handleRequestError(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleBan = async (id, isBanned) => {
    setError('');
    setRequestId('');
    try {
      const api = createAdminClient(secret);
      const json = isBanned
        ? await api.unbanUser(id)
        : await api.banUser(id, banReason);
      setUserDetail((prev) => prev ? { ...prev, ban_expires_at: json.ban_expires_at } : prev);
      setBanReason('');
    } catch (err) {
      handleRequestError(err);
    }
  };

  const resetPassword = async (email) => {
    setError('');
    setRequestId('');
    setResetLink('');
    try {
      const api = createAdminClient(secret);
      const json = await api.resetPassword(email);
      setResetLink(json.actionLink || '');
    } catch (err) {
      handleRequestError(err);
    }
  };

  useEffect(() => {
    if (tab !== 'users') return;
    if (!secret.trim()) return;
    loadUsers(1, usersQuery);
  }, [tab]);

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
            <button onClick={() => (tab === 'summary' ? loadSummary() : tab === 'users' ? loadUsers(page, usersQuery) : loadAudit(auditPage))} className="btn-soft px-6 rounded-xl font-bold">
              {loading || usersLoading || auditLoading ? '加载中...' : '查看'}
            </button>
          </div>
          {error && <div className="mt-3 text-xs text-[#ff6fb1]">{error}</div>}
          {requestId && <div className="mt-2 text-[10px] text-[#7b6f8c]">request_id: {requestId}</div>}

          <div className="mt-6 flex gap-2 text-xs font-bold">
            <button onClick={() => setTab('summary')} className={tab === 'summary' ? 'pill-soft px-3 py-1 rounded-full' : 'text-[#7b6f8c] hover:text-[#ff6fb1]'}>
              统计
            </button>
            <button onClick={() => setTab('users')} className={tab === 'users' ? 'pill-soft px-3 py-1 rounded-full' : 'text-[#7b6f8c] hover:text-[#ff6fb1]'}>
              用户列表
            </button>
            <button onClick={() => { setTab('audit'); loadAudit(1); }} className={tab === 'audit' ? 'pill-soft px-3 py-1 rounded-full' : 'text-[#7b6f8c] hover:text-[#ff6fb1]'}>
              操作审计
            </button>
          </div>

          {tab === 'summary' && <SummaryCards data={data} />}

          {tab === 'users' && (
            <UsersTable
              users={users}
              page={page}
              usersTotal={usersTotal}
              usersHasMore={usersHasMore}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              loadUsers={loadUsers}
              applyUserSearch={applyUserSearch}
              clearUserSearch={clearUserSearch}
              exportUsers={exportUsers}
              onDetail={(u) => {
                setSelectedUser(u);
                loadUserDetail(u.id);
              }}
              usersLoading={usersLoading}
            />
          )}

          {tab === 'audit' && (
            <AuditTable
              auditLogs={auditLogs}
              auditPage={auditPage}
              auditSearch={auditSearch}
              setAuditSearch={setAuditSearch}
              loadAudit={loadAudit}
              auditLoading={auditLoading}
            />
          )}

          <UserDetailModal
            selectedUser={selectedUser}
            onClose={() => {
              setSelectedUser(null);
              setUserDetail(null);
              setResetLink('');
            }}
            detailLoading={detailLoading}
            userDetail={userDetail}
            banReason={banReason}
            setBanReason={setBanReason}
            toggleBan={toggleBan}
            resetPassword={resetPassword}
            resetLink={resetLink}
            userTasks={userTasks}
          />
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
