import React from 'react';

const AuditTable = ({
  auditLogs,
  auditPage,
  auditTotal,
  auditPerPage,
  auditHasMore,
  auditSearch,
  setAuditSearch,
  loadAudit,
  applyAuditSearch,
  clearAuditSearch,
  exportAuditCurrent,
  exportAuditAll,
  auditExporting,
  auditLoading
}) => {
  const totalPages = Number.isFinite(auditTotal)
    ? Math.max(1, Math.ceil(auditTotal / Math.max(auditPerPage || 1, 1)))
    : null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 text-xs text-[#7b6f8c]">
        <span>
          第 {auditPage} 页
          {Number.isFinite(auditTotal) ? ` · 共 ${auditTotal} 条` : ''}
          {totalPages ? ` · 共 ${totalPages} 页` : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => loadAudit(Math.max(auditPage - 1, 1))}
            disabled={auditPage <= 1}
            className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            onClick={() => loadAudit(auditPage + 1)}
            disabled={!auditHasMore}
            className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
          <button onClick={() => loadAudit(auditPage)} className="pill-soft px-3 py-1 rounded-full">{auditLoading ? '加载中...' : '刷新'}</button>
          <button onClick={exportAuditCurrent} className="pill-soft px-3 py-1 rounded-full">导出本页</button>
          <button
            onClick={exportAuditAll}
            disabled={auditExporting}
            className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {auditExporting ? '导出中...' : '导出全部结果'}
          </button>
        </div>
      </div>
      <div className="mb-3 flex flex-col gap-2">
        <input
          type="text"
          value={auditSearch}
          onChange={(e) => setAuditSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyAuditSearch();
          }}
          placeholder="搜索管理员/动作/对象/备注"
          className="w-full text-xs bg-white/80 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
        />
        <div className="flex gap-2">
          <button type="button" onClick={applyAuditSearch} className="pill-soft px-3 py-1 rounded-full text-xs">搜索</button>
          <button type="button" onClick={clearAuditSearch} className="pill-soft px-3 py-1 rounded-full text-xs">清空搜索</button>
        </div>
      </div>
      <div className="card-soft-sm p-4 overflow-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[#7b6f8c]">
            <tr>
              <th className="py-2">时间</th>
              <th className="py-2">管理员</th>
              <th className="py-2">动作</th>
              <th className="py-2">对象</th>
              <th className="py-2">备注</th>
            </tr>
          </thead>
          <tbody className="text-[#3b2e4a]">
            {auditLogs.map((log) => (
              <tr key={log.id} className="border-t border-[#ffe4f2]">
                <td className="py-2">{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                <td className="py-2">{log.admin_email || '-'}</td>
                <td className="py-2">{log.action || '-'}</td>
                <td className="py-2">{log.target_user_id || '-'}</td>
                <td className="py-2">{log.detail?.reason || log.detail?.email || '-'}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && !auditLoading && (
              <tr>
                <td className="py-4 text-[#7b6f8c]" colSpan="5">暂无记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTable;
