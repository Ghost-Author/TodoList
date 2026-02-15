import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { initSentry, Sentry } from './sentry.js';
import { createAdminClient } from './utils/adminApi.js';
import SummaryCards from './admin-components/SummaryCards.jsx';
import UsersTable from './admin-components/UsersTable.jsx';
import AuditTable from './admin-components/AuditTable.jsx';
import UserDetailModal from './admin-components/UserDetailModal.jsx';

const USERS_PER_PAGE = 20;
const AUDIT_PER_PAGE = 20;

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
  const [auditTotal, setAuditTotal] = useState(null);
  const [auditHasMore, setAuditHasMore] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditQuery, setAuditQuery] = useState('');
  const [requestId, setRequestId] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [usersExporting, setUsersExporting] = useState(false);
  const [auditExporting, setAuditExporting] = useState(false);
  const [retryAction, setRetryAction] = useState('');
  const usersReqSeqRef = useRef(0);
  const auditReqSeqRef = useRef(0);
  const detailReqSeqRef = useRef(0);

  const handleRequestError = (err, action = '') => {
    const message = err?.message || '请求失败';
    setError(message);
    setRetryAction(action);
    const matched = message.match(/request_id:\s*([^)]+)/i);
    setRequestId(matched?.[1]?.trim() || '');
  };

  const loadSummary = async () => {
    setError('');
    setRequestId('');
    setRetryAction('');
    setLoading(true);
    try {
      const api = createAdminClient(secret);
      const json = await api.getSummary();
      setData(json);
    } catch (err) {
      handleRequestError(err, 'summary');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (targetPage = 1, targetQuery = usersQuery) => {
    const seq = ++usersReqSeqRef.current;
    setError('');
    setRequestId('');
    setRetryAction('');
    setUsersLoading(true);
    try {
      const api = createAdminClient(secret);
      const json = await api.getUsers(targetPage, USERS_PER_PAGE, targetQuery);
      if (seq !== usersReqSeqRef.current) return;
      setUsers(json.users || []);
      setPage(targetPage);
      setUsersTotal(Number.isFinite(json.total) ? json.total : null);
      setUsersHasMore(Boolean(json.has_more));
    } catch (err) {
      if (seq !== usersReqSeqRef.current) return;
      handleRequestError(err, 'users');
    } finally {
      if (seq !== usersReqSeqRef.current) return;
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

  const toCsv = (rows, header) => (
    [header.join(','), ...rows.map((r) => header.map((k) => `"${String(r[k] ?? '').replace(/\"/g, '""')}"`).join(','))].join('\n')
  );

  const downloadCsv = (filename, csv) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportUsersCurrent = () => {
    const rows = users.map((u) => ({
      email: u.email || '',
      created_at: u.created_at || '',
      last_sign_in_at: u.last_sign_in_at || ''
    }));
    const header = ['email', 'created_at', 'last_sign_in_at'];
    downloadCsv(`users_page_${page}.csv`, toCsv(rows, header));
  };

  const exportUsersAll = async () => {
    setError('');
    setRequestId('');
    setRetryAction('');
    setUsersExporting(true);
    try {
      const api = createAdminClient(secret);
      const q = usersQuery;
      const perPage = 100;
      let targetPage = 1;
      let all = [];

      while (true) {
        const json = await api.getUsers(targetPage, perPage, q);
        const rows = (json.users || []).map((u) => ({
          email: u.email || '',
          created_at: u.created_at || '',
          last_sign_in_at: u.last_sign_in_at || ''
        }));
        all = all.concat(rows);
        if (!json.has_more || targetPage >= 1000) break;
        targetPage += 1;
      }

      const header = ['email', 'created_at', 'last_sign_in_at'];
      const suffix = q ? `search_${encodeURIComponent(q).slice(0, 24)}` : 'all';
      downloadCsv(`users_${suffix}.csv`, toCsv(all, header));
    } catch (err) {
      handleRequestError(err, 'users_export');
    } finally {
      setUsersExporting(false);
    }
  };

  const loadAudit = async (targetPage = 1, targetQuery = auditQuery) => {
    const seq = ++auditReqSeqRef.current;
    setError('');
    setRequestId('');
    setRetryAction('');
    setAuditLoading(true);
    try {
      const api = createAdminClient(secret);
      const json = await api.getAudit(targetPage, AUDIT_PER_PAGE, targetQuery);
      if (seq !== auditReqSeqRef.current) return;
      setAuditLogs(json.logs || []);
      setAuditPage(targetPage);
      setAuditTotal(Number.isFinite(json.total) ? json.total : null);
      setAuditHasMore(Boolean(json.has_more));
    } catch (err) {
      if (seq !== auditReqSeqRef.current) return;
      handleRequestError(err, 'audit');
    } finally {
      if (seq !== auditReqSeqRef.current) return;
      setAuditLoading(false);
    }
  };

  const applyAuditSearch = async () => {
    const q = auditSearch.trim();
    setAuditQuery(q);
    await loadAudit(1, q);
  };

  const clearAuditSearch = async () => {
    setAuditSearch('');
    setAuditQuery('');
    await loadAudit(1, '');
  };

  const exportAuditCurrent = () => {
    const rows = auditLogs.map((log) => ({
      created_at: log.created_at || '',
      admin_email: log.admin_email || '',
      action: log.action || '',
      target_user_id: log.target_user_id || '',
      reason: log.detail?.reason || '',
      email: log.detail?.email || ''
    }));
    const header = ['created_at', 'admin_email', 'action', 'target_user_id', 'reason', 'email'];
    downloadCsv(`audit_page_${auditPage}.csv`, toCsv(rows, header));
  };

  const exportAuditAll = async () => {
    setError('');
    setRequestId('');
    setRetryAction('');
    setAuditExporting(true);
    try {
      const api = createAdminClient(secret);
      const q = auditQuery;
      const perPage = 100;
      let targetPage = 1;
      let all = [];

      while (true) {
        const json = await api.getAudit(targetPage, perPage, q);
        const rows = (json.logs || []).map((log) => ({
          created_at: log.created_at || '',
          admin_email: log.admin_email || '',
          action: log.action || '',
          target_user_id: log.target_user_id || '',
          reason: log.detail?.reason || '',
          email: log.detail?.email || ''
        }));
        all = all.concat(rows);
        if (!json.has_more || targetPage >= 1000) break;
        targetPage += 1;
      }

      const header = ['created_at', 'admin_email', 'action', 'target_user_id', 'reason', 'email'];
      const suffix = q ? `search_${encodeURIComponent(q).slice(0, 24)}` : 'all';
      downloadCsv(`audit_${suffix}.csv`, toCsv(all, header));
    } catch (err) {
      handleRequestError(err, 'audit_export');
    } finally {
      setAuditExporting(false);
    }
  };

  const loadUserDetail = async (id) => {
    const seq = ++detailReqSeqRef.current;
    setDetailLoading(true);
    setResetLink('');
    setUserTasks([]);
    setRequestId('');
    try {
      const api = createAdminClient(secret);
      const json = await api.getUser(id);
      if (seq !== detailReqSeqRef.current) return;
      setUserDetail(json);
      const tasksJson = await api.getUserTasks(id);
      if (seq !== detailReqSeqRef.current) return;
      setUserTasks(tasksJson.tasks || []);
    } catch (err) {
      if (seq !== detailReqSeqRef.current) return;
      handleRequestError(err, 'user_detail');
    } finally {
      if (seq !== detailReqSeqRef.current) return;
      setDetailLoading(false);
    }
  };

  const closeUserDetail = () => {
    detailReqSeqRef.current += 1;
    setSelectedUser(null);
    setUserDetail(null);
    setResetLink('');
    setDetailLoading(false);
  };

  const toggleBan = async (id, isBanned) => {
    setError('');
    setRequestId('');
    setRetryAction('');
    setBanLoading(true);
    try {
      const api = createAdminClient(secret);
      const json = isBanned
        ? await api.unbanUser(id)
        : await api.banUser(id, banReason);
      setUserDetail((prev) => prev ? { ...prev, ban_expires_at: json.ban_expires_at } : prev);
      setBanReason('');
    } catch (err) {
      handleRequestError(err, 'toggle_ban');
    } finally {
      setBanLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setError('');
    setRequestId('');
    setRetryAction('');
    setResetLink('');
    setResetLoading(true);
    try {
      const api = createAdminClient(secret);
      const json = await api.resetPassword(email);
      setResetLink(json.actionLink || '');
    } catch (err) {
      handleRequestError(err, 'reset_password');
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'users') return;
    if (!secret.trim()) return;
    loadUsers(1, usersQuery);
  }, [tab]);

  const retryLastAction = async () => {
    if (!secret.trim() || !retryAction) return;
    if (retryAction === 'summary') {
      await loadSummary();
      return;
    }
    if (retryAction === 'users') {
      await loadUsers(page, usersQuery);
      return;
    }
    if (retryAction === 'users_export') {
      await exportUsersAll();
      return;
    }
    if (retryAction === 'audit') {
      await loadAudit(auditPage, auditQuery);
      return;
    }
    if (retryAction === 'audit_export') {
      await exportAuditAll();
      return;
    }
    if (retryAction === 'user_detail' && selectedUser?.id) {
      await loadUserDetail(selectedUser.id);
      return;
    }
    if (retryAction === 'toggle_ban' && selectedUser?.id) {
      await toggleBan(selectedUser.id, Boolean(userDetail?.ban_expires_at));
      return;
    }
    if (retryAction === 'reset_password' && selectedUser?.email) {
      await resetPassword(selectedUser.email);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="card-soft p-4 md:p-8 mt-6 md:mt-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#3b2e4a]">后台面板</h1>
          <p className="text-[#7b6f8c] mt-2">请输入管理员密钥以查看统计数据。</p>
          <div className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin Secret"
              className="flex-1 text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
            />
            <button onClick={() => (tab === 'summary' ? loadSummary() : tab === 'users' ? loadUsers(page, usersQuery) : loadAudit(auditPage, auditQuery))} className="btn-soft px-6 py-3 rounded-xl font-bold">
              {loading || usersLoading || auditLoading ? '加载中...' : '查看'}
            </button>
          </div>
          {error && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="text-xs text-[#ff6fb1] break-all">{error}</div>
              <button
                type="button"
                onClick={retryLastAction}
                disabled={!retryAction || loading || usersLoading || auditLoading || detailLoading || banLoading || resetLoading || usersExporting || auditExporting}
                className="pill-soft px-2 py-0.5 rounded-full text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                重试
              </button>
            </div>
          )}
          {requestId && <div className="mt-2 text-[10px] text-[#7b6f8c]">request_id: {requestId}</div>}

          <div className="mt-5 md:mt-6 flex gap-2 text-xs font-bold overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            <button onClick={() => setTab('summary')} className={`shrink-0 ${tab === 'summary' ? 'pill-soft px-3 py-1 rounded-full' : 'text-[#7b6f8c] hover:text-[#ff6fb1]'}`}>
              统计
            </button>
            <button onClick={() => setTab('users')} className={`shrink-0 ${tab === 'users' ? 'pill-soft px-3 py-1 rounded-full' : 'text-[#7b6f8c] hover:text-[#ff6fb1]'}`}>
              用户列表
            </button>
            <button onClick={() => { setTab('audit'); loadAudit(1, auditQuery); }} className={`shrink-0 ${tab === 'audit' ? 'pill-soft px-3 py-1 rounded-full' : 'text-[#7b6f8c] hover:text-[#ff6fb1]'}`}>
              操作审计
            </button>
          </div>

          {tab === 'summary' && (
            loading ? (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="card-soft-sm p-4">
                    <div className="skeleton-line h-6 w-12 mx-auto mb-2" />
                    <div className="skeleton-line h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            ) : <SummaryCards data={data} />
          )}

          {tab === 'users' && (
            <UsersTable
              users={users}
              page={page}
              usersTotal={usersTotal}
              usersPerPage={USERS_PER_PAGE}
              usersHasMore={usersHasMore}
              userSearch={userSearch}
              usersQuery={usersQuery}
              setUserSearch={setUserSearch}
              loadUsers={loadUsers}
              applyUserSearch={applyUserSearch}
              clearUserSearch={clearUserSearch}
              exportUsersCurrent={exportUsersCurrent}
              exportUsersAll={exportUsersAll}
              usersExporting={usersExporting}
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
              auditTotal={auditTotal}
              auditPerPage={AUDIT_PER_PAGE}
              auditHasMore={auditHasMore}
              auditSearch={auditSearch}
              auditQuery={auditQuery}
              setAuditSearch={setAuditSearch}
              loadAudit={loadAudit}
              applyAuditSearch={applyAuditSearch}
              clearAuditSearch={clearAuditSearch}
              exportAuditCurrent={exportAuditCurrent}
              exportAuditAll={exportAuditAll}
              auditExporting={auditExporting}
              auditLoading={auditLoading}
            />
          )}

          <UserDetailModal
            selectedUser={selectedUser}
            onClose={closeUserDetail}
            detailLoading={detailLoading}
            userDetail={userDetail}
            banReason={banReason}
            setBanReason={setBanReason}
            toggleBan={toggleBan}
            banLoading={banLoading}
            resetPassword={resetPassword}
            resetLoading={resetLoading}
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
