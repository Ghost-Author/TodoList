import React, { useEffect, useState } from 'react';

const AuditTable = ({
  auditLogs,
  auditPage,
  auditTotal,
  auditPerPage,
  auditHasMore,
  auditSearch,
  auditQuery,
  setAuditSearch,
  loadAudit,
  applyAuditSearch,
  clearAuditSearch,
  exportAuditCurrent,
  exportAuditAll,
  auditExporting,
  auditLoading
}) => {
  const [visibleCols, setVisibleCols] = useState({
    time: true,
    admin: true,
    action: true,
    target: true,
    detail: true
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_audit_visible_cols');
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
      localStorage.setItem('admin_audit_visible_cols', JSON.stringify(visibleCols));
    } catch {
      // Ignore storage write errors.
    }
  }, [visibleCols]);

  const visibleCount = ['time', 'admin', 'action', 'target', 'detail'].filter((key) => visibleCols[key]).length;
  const safeVisibleCount = Math.max(visibleCount, 1);
  const setColumnVisible = (key) => {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalPages = Number.isFinite(auditTotal)
    ? Math.max(1, Math.ceil(auditTotal / Math.max(auditPerPage || 1, 1)))
    : null;
  const appliedQuery = String(auditQuery || '').trim();

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
          第 {auditPage} 页
          {Number.isFinite(auditTotal) ? ` · 共 ${auditTotal} 条` : ''}
          {totalPages ? ` · 共 ${totalPages} 页` : ''}
        </span>
        <div className="flex flex-wrap gap-2">
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
      {appliedQuery && (
        <div className="mb-3 flex items-center gap-2 flex-wrap text-[11px] text-[#7b6f8c]">
          <span className="font-bold">已搜索</span>
          <span className="pill-soft px-2 py-1 rounded-full">"{appliedQuery}"</span>
          <button type="button" onClick={clearAuditSearch} className="pill-soft px-2 py-1 rounded-full text-[10px]">
            清除并重查
          </button>
        </div>
      )}
      <div className="mb-3 flex items-center gap-2 flex-wrap text-[11px] text-[#7b6f8c]">
        <span className="font-bold">显示列</span>
        <button type="button" onClick={() => setColumnVisible('time')} className={`pill-soft px-2 py-1 rounded-full ${visibleCols.time ? '' : 'opacity-50'}`}>时间</button>
        <button type="button" onClick={() => setColumnVisible('admin')} className={`pill-soft px-2 py-1 rounded-full ${visibleCols.admin ? '' : 'opacity-50'}`}>管理员</button>
        <button type="button" onClick={() => setColumnVisible('action')} className={`pill-soft px-2 py-1 rounded-full ${visibleCols.action ? '' : 'opacity-50'}`}>动作</button>
        <button type="button" onClick={() => setColumnVisible('target')} className={`pill-soft px-2 py-1 rounded-full ${visibleCols.target ? '' : 'opacity-50'}`}>对象</button>
        <button type="button" onClick={() => setColumnVisible('detail')} className={`pill-soft px-2 py-1 rounded-full ${visibleCols.detail ? '' : 'opacity-50'}`}>备注</button>
      </div>

      <div className="md:hidden space-y-2">
        {auditLogs.map((log) => (
          <div key={log.id} className="card-soft-sm p-3 text-xs text-[#7b6f8c] space-y-1.5">
            {visibleCols.time && (
              <div>
                <span className="font-black text-[#3b2e4a]">时间：</span>
                <span>{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</span>
              </div>
            )}
            {visibleCols.admin && (
              <div>
                <span className="font-black text-[#3b2e4a]">管理员：</span>
                <span className="break-all">{renderHighlighted(log.admin_email || '-')}</span>
              </div>
            )}
            {visibleCols.action && (
              <div>
                <span className="font-black text-[#3b2e4a]">动作：</span>
                <span>{renderHighlighted(log.action || '-')}</span>
              </div>
            )}
            {visibleCols.target && (
              <div>
                <span className="font-black text-[#3b2e4a]">对象：</span>
                <span className="break-all">{renderHighlighted(log.target_user_id || '-')}</span>
              </div>
            )}
            {visibleCols.detail && (
              <div>
                <span className="font-black text-[#3b2e4a]">备注：</span>
                <span>{renderHighlighted(log.detail?.reason || log.detail?.email || '-')}</span>
              </div>
            )}
          </div>
        ))}
        {auditLogs.length === 0 && !auditLoading && (
          <div className="card-soft-sm p-4 text-xs text-[#7b6f8c] text-center">暂无记录</div>
        )}
      </div>

      <div className="hidden md:block card-soft-sm p-4 overflow-auto">
        <table className="w-full text-xs text-left min-w-[860px]">
          <thead className="text-[#7b6f8c]">
            <tr>
              {visibleCols.time && <th className="py-2">时间</th>}
              {visibleCols.admin && <th className="py-2">管理员</th>}
              {visibleCols.action && <th className="py-2">动作</th>}
              {visibleCols.target && <th className="py-2">对象</th>}
              {visibleCols.detail && <th className="py-2">备注</th>}
            </tr>
          </thead>
          <tbody className="text-[#3b2e4a]">
            {auditLogs.map((log) => (
              <tr key={log.id} className="border-t border-[#ffe4f2]">
                {visibleCols.time && <td className="py-2">{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>}
                {visibleCols.admin && <td className="py-2 break-all">{renderHighlighted(log.admin_email || '-')}</td>}
                {visibleCols.action && <td className="py-2">{renderHighlighted(log.action || '-')}</td>}
                {visibleCols.target && <td className="py-2 break-all">{renderHighlighted(log.target_user_id || '-')}</td>}
                {visibleCols.detail && <td className="py-2">{renderHighlighted(log.detail?.reason || log.detail?.email || '-')}</td>}
              </tr>
            ))}
            {auditLogs.length === 0 && !auditLoading && (
              <tr>
                <td className="py-4 text-[#7b6f8c]" colSpan={safeVisibleCount}>暂无记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTable;
