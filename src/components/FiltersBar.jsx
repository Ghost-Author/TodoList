import React, { useEffect, useMemo, useRef, useState } from 'react';

const FiltersBar = ({
  filter,
  setFilter,
  taskCounts,
  taskDensity,
  setTaskDensity,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectAllFiltered,
  clearSelection,
  bulkComplete,
  bulkDelete,
  clearCompleted,
  bulkSetFields,
  bulkActionLoading,
  canDrag,
  selectedCount,
  filteredCount,
  filteredTasks,
  categories
}) => {
  const [bulkPriority, setBulkPriority] = useState('medium');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const searchInputRef = useRef(null);
  const searchQueryRef = useRef(searchQuery);
  const noSelection = !selectedCount;
  const noFiltered = !filteredCount;
  const isBulkBusy = Boolean(bulkActionLoading);
  const canSwitchToDragMode = !canDrag;
  const totalCount = taskCounts?.all || 0;
  const completedCount = taskCounts?.completed || 0;
  const overdueCount = taskCounts?.overdue || 0;
  const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const overduePercent = totalCount > 0 ? Math.round((overdueCount / totalCount) * 100) : 0;
  const topTags = useMemo(() => {
    const counter = new Map();
    (filteredTasks || []).forEach((task) => {
      (task.tags || []).forEach((tag) => {
        const key = String(tag || '').trim();
        if (!key) return;
        counter.set(key, (counter.get(key) || 0) + 1);
      });
    });
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [filteredTasks]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      const tag = target?.tagName?.toLowerCase?.() || '';
      const isTypingTarget = tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;

      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (isTypingTarget) return;
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select?.();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        if (isTypingTarget) return;
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select?.();
        return;
      }

      if (e.key === 'Escape' && document.activeElement === searchInputRef.current && searchQueryRef.current) {
        e.preventDefault();
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSearchQuery]);

  return (
    <div className="surface-soft filter-panel-glass p-4 md:p-5 flex flex-col gap-4">
      <div className="rounded-xl border border-[#ffe4f2] bg-white/80 p-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#7b6f8c] mb-2 gap-3">
          <span>任务进度</span>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-[#ffd9ec] bg-white/80 p-0.5">
              <button
                type="button"
                onClick={() => setTaskDensity('cozy')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${taskDensity === 'cozy' ? 'bg-[#ff8acb] text-white' : 'text-[#7b6f8c]'}`}
              >
                舒适
              </button>
              <button
                type="button"
                onClick={() => setTaskDensity('compact')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${taskDensity === 'compact' ? 'bg-[#ff8acb] text-white' : 'text-[#7b6f8c]'}`}
              >
                紧凑
              </button>
            </div>
            <span>{completedPercent}% 已完成</span>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-[#f7eaf1] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#ff8acb] to-[#8fd3ff]" style={{ width: `${completedPercent}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-[#7b6f8c]">
          <span>总任务 {totalCount}</span>
          <span className={overdueCount > 0 ? 'text-red-500 font-bold' : ''}>
            逾期 {overdueCount}（{overduePercent}%）
          </span>
        </div>
      </div>
      <div className="flex gap-6 border-b border-[#ffe4f2] overflow-x-auto no-scrollbar pb-1">
        {['all', 'active', 'overdue', 'completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`pb-3 text-sm font-bold relative whitespace-nowrap transition-colors flex items-center gap-1 ${filter === f ? 'text-[#ff6fb1]' : 'text-slate-400 hover:text-[#ff6fb1]'}`}>
            <span>{f === 'all' ? '全部任务' : f === 'active' ? '进行中' : f === 'overdue' ? '逾期' : '已归档'}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${filter === f ? 'bg-white/90 border-[#ffd2e7] text-[#ff6fb1]' : 'bg-white/70 border-[#efe3f3] text-slate-400'}`}>
              {f === 'all'
                ? taskCounts?.all || 0
                : f === 'active'
                  ? taskCounts?.active || 0
                  : f === 'overdue'
                    ? taskCounts?.overdue || 0
                    : taskCounts?.completed || 0}
            </span>
            {filter === f && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#ff8acb] rounded-full" />}
          </button>
        ))}
      </div>
      {(taskCounts?.overdue || 0) > 0 && (
        <div className="text-[11px]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100 font-bold">
            逾期未完成 {taskCounts.overdue} 条
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索任务/备注/分类/标签（/ 或 Ctrl/Cmd+K）"
            className="w-full text-sm bg-white/82 rounded-xl p-2.5 pr-20 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#7b6f8c] bg-white/90 border border-[#ffe4f2] rounded-full px-2 py-0.5 hover:text-[#ff6fb1]"
              aria-label="清空搜索"
            >
              清空
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full text-sm bg-white/82 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
        >
          <option value="manual">手动排序</option>
          <option value="created_desc">按创建时间（新→旧）</option>
          <option value="created_asc">按创建时间（旧→新）</option>
          <option value="due_asc">按截止日期（近→远）</option>
          <option value="due_desc">按截止日期（远→近）</option>
          <option value="priority">按优先级</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setSortBy('created_desc');
            setFilter('all');
          }}
          className="pill-soft px-4 py-2 rounded-xl text-sm font-bold"
        >
          清除筛选
        </button>
      </div>
      <div className="flex items-center justify-between text-[10px] text-[#7b6f8c]">
        <span>匹配任务 {filteredCount} / 总任务 {totalCount}</span>
        {searchQuery && (
          <span className="text-[#ff6fb1] font-bold">当前关键词：{searchQuery}</span>
        )}
      </div>
      {topTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black text-[#7b6f8c] uppercase tracking-wider">热门标签</span>
          {topTags.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(tag)}
              className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold"
              title={`按标签 ${tag} 过滤`}
            >
              #{tag} · {count}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="pill-soft px-3 py-1 rounded-full text-[#7b6f8c]">
          已选 {selectedCount || 0} 条
        </span>
        {canSwitchToDragMode && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilter('all');
              setSortBy('manual');
            }}
            className="px-3 py-1 rounded-full font-bold text-white bg-gradient-to-r from-[#ff8acb] to-[#8fd3ff] whitespace-nowrap"
            title="切换到可拖动排序的状态"
          >
            进入拖动排序模式
          </button>
        )}
        <button
          type="button"
          onClick={selectAllFiltered}
          disabled={noFiltered}
          className="pill-soft px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          全选当前
        </button>
        <button
          type="button"
          onClick={clearSelection}
          disabled={noSelection}
          className="pill-soft px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          取消选择
        </button>
        <button
          type="button"
          onClick={() => bulkComplete(true)}
          disabled={noSelection || isBulkBusy}
          className="pill-soft px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bulkActionLoading === 'complete' ? '处理中...' : '标记完成'}
        </button>
        <button
          type="button"
          onClick={() => bulkComplete(false)}
          disabled={noSelection || isBulkBusy}
          className="pill-soft px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bulkActionLoading === 'uncomplete' ? '处理中...' : '标记未完成'}
        </button>
        <button
          type="button"
          disabled={noSelection || isBulkBusy}
          onClick={() => {
            if (window.confirm('确定要删除所选任务吗？')) {
              bulkDelete();
            }
          }}
          className="px-3 py-1 rounded-full font-bold text-white bg-[#ff7aa8] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bulkActionLoading === 'delete' ? '删除中...' : '批量删除'}
        </button>
        <button
          type="button"
          disabled={(taskCounts?.completed || 0) === 0 || isBulkBusy}
          onClick={() => {
            if (window.confirm('确定要清理所有已完成任务吗？')) {
              clearCompleted();
            }
          }}
          className="px-3 py-1 rounded-full font-bold text-white bg-[#ff8f6b] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bulkActionLoading === 'clearCompleted' ? '清理中...' : '清理已完成'}
        </button>
        <div className="h-4 w-px bg-[#ffe4f2] mx-1" />
        <select
          value={bulkPriority}
          onChange={(e) => setBulkPriority(e.target.value)}
          className="text-[11px] bg-white/85 rounded-xl px-2 py-1 outline-none ring-1 ring-[#ffe4f2]"
          disabled={noSelection || isBulkBusy}
        >
          <option value="high">重要且紧急</option>
          <option value="medium">重要不紧急</option>
          <option value="low">不重要但紧急</option>
          <option value="none">不重要不紧急</option>
        </select>
        <button
          type="button"
          onClick={() => {
            void bulkSetFields?.({ priority: bulkPriority });
          }}
          disabled={noSelection || isBulkBusy}
          className="pill-soft px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          应用优先级
        </button>
        <select
          value={bulkCategory}
          onChange={(e) => setBulkCategory(e.target.value)}
          className="text-[11px] bg-white/85 rounded-xl px-2 py-1 outline-none ring-1 ring-[#ffe4f2]"
          disabled={noSelection || isBulkBusy}
        >
          <option value="">未分类</option>
          {(categories || []).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            void bulkSetFields?.({ category: bulkCategory });
          }}
          disabled={noSelection || isBulkBusy}
          className="pill-soft px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          应用分类
        </button>
        <input
          type="date"
          value={bulkDueDate}
          onChange={(e) => setBulkDueDate(e.target.value)}
          disabled={noSelection || isBulkBusy}
          className="text-[11px] bg-white/85 rounded-xl px-2 py-1 outline-none ring-1 ring-[#ffe4f2] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => {
            void bulkSetFields?.({ dueDate: bulkDueDate || '' });
          }}
          disabled={noSelection || isBulkBusy}
          className="pill-soft px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          应用日期
        </button>
        <button
          type="button"
          onClick={() => {
            void bulkSetFields?.({ dueDate: '' });
          }}
          disabled={noSelection || isBulkBusy}
          className="pill-soft px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          清空日期
        </button>
        <span className="text-[10px] text-[#7b6f8c] self-center ml-1 whitespace-nowrap">
          {canDrag ? '拖动任务可手动排序 · Shift+点击可范围选择' : '切换到手动排序且清空筛选后可拖动 · Shift+点击可范围选择'}
        </span>
      </div>
    </div>
  );
};

export default FiltersBar;
