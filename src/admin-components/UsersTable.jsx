import React from 'react';

const UsersTable = ({
  users,
  page,
  usersTotal,
  usersPerPage,
  usersHasMore,
  userSearch,
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
  const totalPages = Number.isFinite(usersTotal)
    ? Math.max(1, Math.ceil(usersTotal / Math.max(usersPerPage || 1, 1)))
    : null;

  return (
    <div className="mt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 text-xs text-[#7b6f8c]">
        <span>
          第 {page} 页
          {Number.isFinite(usersTotal) ? ` · 共 ${usersTotal} 位用户` : ''}
          {totalPages ? ` · 共 ${totalPages} 页` : ''}
        </span>
        <div className="flex gap-2">
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
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[#ffe4f2]">
                <td className="py-2">{u.email || '-'}</td>
                <td className="py-2">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                <td className="py-2">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '-'}</td>
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
                <td className="py-4 text-[#7b6f8c]" colSpan="4">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
