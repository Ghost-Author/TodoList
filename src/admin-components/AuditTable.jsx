import React from 'react';

const AuditTable = ({
  auditLogs,
  auditPage,
  auditSearch,
  setAuditSearch,
  loadAudit,
  auditLoading
}) => {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 text-xs text-[#7b6f8c]">
        <span>第 {auditPage} 页</span>
        <div className="flex gap-2">
          <button onClick={() => loadAudit(Math.max(auditPage - 1, 1))} className="pill-soft px-3 py-1 rounded-full">上一页</button>
          <button onClick={() => loadAudit(auditPage + 1)} className="pill-soft px-3 py-1 rounded-full">下一页</button>
          <button onClick={() => loadAudit(auditPage)} className="pill-soft px-3 py-1 rounded-full">{auditLoading ? '加载中...' : '刷新'}</button>
        </div>
      </div>
      <input
        type="text"
        value={auditSearch}
        onChange={(e) => setAuditSearch(e.target.value)}
        placeholder="搜索管理员/动作/对象"
        className="mb-3 w-full text-xs bg-white/80 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
      />
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
            {auditLogs.filter((log) => {
              const q = auditSearch.trim().toLowerCase();
              if (!q) return true;
              const hay = [
                log.admin_email || '',
                log.action || '',
                log.target_user_id || ''
              ].join(' ').toLowerCase();
              return hay.includes(q);
            }).map((log) => (
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
