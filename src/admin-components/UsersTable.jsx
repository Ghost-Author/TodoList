import React, { useEffect, useState } from 'react';

const UsersTable = ({
  users,
  page,
  usersTotal,
  usersPerPage,
  usersHasMore,
  userSearch,
  usersQuery,
  setUserSearch,
  loadUsers,
  applyUserSearch,
  clearUserSearch,
  exportUsersCurrent,
  exportUsersAll,
  usersExporting,
  onDetail,
  usersLoading
}) => {
  const [visibleCols, setVisibleCols] = useState({
    email: true,
    created: true,
    lastLogin: true
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_users_visible_cols');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      setVisibleCols((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore storage parse errors.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('admin_users_visible_cols', JSON.stringify(visibleCols));
    } catch {
      // Ignore storage write errors.
    }
  }, [visibleCols]);

  const visibleCount = ['email', 'created', 'lastLogin'].filter((key) => visibleCols[key]).length;
  const safeVisibleCount = Math.max(visibleCount, 1);
  const setColumnVisible = (key) => {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalPages = Number.isFinite(usersTotal)
    ? Math.max(1, Math.ceil(usersTotal / Math.max(usersPerPage || 1, 1)))
    : null;
  const appliedQuery = String(usersQuery || '').trim();

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const renderHighlighted = (text) => {
    const raw = String(text || '');
    if (!appliedQuery) return raw;
    const matcher = new RegExp(`(${escapeRegExp(appliedQuery)})`, 'ig');
    const needle = appliedQuery.toLowerCase();
    return raw.split(matcher).map((part, idx) => (
      part.toLowerCase() === needle
        ? <mark key={`${part}-${idx}`} className="bg-[#ffe597] text-[#3b2e4a] rounded px-0.5">{part}</mark>
        : <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>
    ));
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 text-xs text-[#7b6f8c]">
        <span>
          第 {page} 页
          {Number.isFinite(usersTotal) ? ` · 共 ${usersTotal} 位用户` : ''}
          {totalPages ? ` · 共 ${totalPages} 页` : ''}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadUsers(Math.max(page - 1, 1))}
            disabled={page <= 1}
            className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            onClick={() => loadUsers(page + 1)}
            disabled={!usersHasMore}
            className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
          <button onClick={exportUsersCurrent} className="pill-soft px-3 py-1 rounded-full">导出本页</button>
          <button
            onClick={exportUsersAll}
            disabled={usersExporting}
            className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {usersExporting ? '导出中...' : '导出全部结果'}
          </button>
        </div>
      </div>
      <input
        type="text"
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            applyUserSearch();
          }
        }}
        placeholder="搜索邮箱（回车触发服务端搜索）"
        className="mb-3 w-full text-xs bg-white/80 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
      />
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={applyUserSearch}
          className="pill-soft px-3 py-1 rounded-full text-xs"
        >
          搜索
        </button>
        <button
          type="button"
          onClick={clearUserSearch}
          className="pill-soft px-3 py-1 rounded-full text-xs"
        >
          清空搜索
        </button>
      </div>
      {appliedQuery && (
        <div className="mb-3 flex items-center gap-2 flex-wrap text-[11px] text-[#7b6f8c]">
          <span className="font-bold">已搜索</span>
          <span className="pill-soft px-2 py-1 rounded-full">"{appliedQuery}"</span>
          <button type="button" onClick={clearUserSearch} className="pill-soft px-2 py-1 rounded-full text-[10px]">
            清除并重查
          </button>
        </div>
      )}
      <div className="mb-3 flex items-center gap-2 flex-wrap text-[11px] text-[#7b6f8c]">
        <span className="font-bold">显示列</span>
        <button type="button" onClick={() => setColumnVisible('email')} className={`pill-soft px-2 py-1 rounded-full ${visibleCols.email ? '' : 'opacity-50'}`}>邮箱</button>
        <button type="button" onClick={() => setColumnVisible('created')} className={`pill-soft px-2 py-1 rounded-full ${visibleCols.created ? '' : 'opacity-50'}`}>创建时间</button>
        <button type="button" onClick={() => setColumnVisible('lastLogin')} className={`pill-soft px-2 py-1 rounded-full ${visibleCols.lastLogin ? '' : 'opacity-50'}`}>最近登录</button>
      </div>

      <div className="md:hidden space-y-2">
        {users.map((u) => (
          <div key={u.id} className="card-soft-sm p-3">
            <div className="space-y-1.5 text-xs text-[#7b6f8c]">
              {visibleCols.email && (
                <div>
                  <span className="font-black text-[#3b2e4a]">邮箱：</span>
                  <span className="break-all">{renderHighlighted(u.email || '-')}</span>
                </div>
              )}
              {visibleCols.created && (
                <div>
                  <span className="font-black text-[#3b2e4a]">创建：</span>
                  <span>{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</span>
                </div>
              )}
              {visibleCols.lastLogin && (
                <div>
                  <span className="font-black text-[#3b2e4a]">最近登录：</span>
                  <span>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '-'}</span>
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onDetail(u)}
                className="pill-soft px-3 py-1 rounded-full text-[10px] font-bold"
              >
                详情
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && !usersLoading && (
          <div className="card-soft-sm p-4 text-xs text-[#7b6f8c] text-center">暂无数据</div>
        )}
      </div>

      <div className="hidden md:block card-soft-sm p-4 overflow-auto">
        <table className="w-full text-xs text-left min-w-[620px]">
          <thead className="text-[#7b6f8c]">
            <tr>
              {visibleCols.email && <th className="py-2">邮箱</th>}
              {visibleCols.created && <th className="py-2">创建时间</th>}
              {visibleCols.lastLogin && <th className="py-2">最近登录</th>}
              <th className="py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="text-[#3b2e4a]">
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[#ffe4f2]">
                {visibleCols.email && <td className="py-2 break-all">{renderHighlighted(u.email || '-')}</td>}
                {visibleCols.created && <td className="py-2">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>}
                {visibleCols.lastLogin && <td className="py-2">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '-'}</td>}
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onDetail(u)}
                    className="pill-soft px-3 py-1 rounded-full text-[10px] font-bold"
                  >
                    详情
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !usersLoading && (
              <tr>
                <td className="py-4 text-[#7b6f8c]" colSpan={safeVisibleCount + 1}>暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
