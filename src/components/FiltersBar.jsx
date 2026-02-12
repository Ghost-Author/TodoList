import React, { useMemo } from 'react';

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
  canDrag,
  selectedCount,
  filteredCount,
  filteredTasks
}) => {
  const noSelection = !selectedCount;
  const noFiltered = !filteredCount;
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

  return (
    <div className="surface-soft p-4 md:p-5 flex flex-col gap-4 mb-6">
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
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索任务/备注/分类/标签"
          className="w-full text-sm bg-white/82 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
        />
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
        <button
          type="button"
          onClick={selectAllFiltered}
          disabled={noFiltered}
          className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          全选当前
        </button>
        <button
          type="button"
          onClick={clearSelection}
          disabled={noSelection}
          className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          取消选择
        </button>
        <button
          type="button"
          onClick={() => bulkComplete(true)}
          disabled={noSelection}
          className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          标记完成
        </button>
        <button
          type="button"
          onClick={() => bulkComplete(false)}
          disabled={noSelection}
          className="pill-soft px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          标记未完成
        </button>
        <button
          type="button"
          disabled={noSelection}
          onClick={() => {
            if (window.confirm('确定要删除所选任务吗？')) {
              bulkDelete();
            }
          }}
          className="px-3 py-1 rounded-full font-bold text-white bg-[#ff7aa8] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          批量删除
        </button>
        <button
          type="button"
          disabled={(taskCounts?.completed || 0) === 0}
          onClick={() => {
            if (window.confirm('确定要清理所有已完成任务吗？')) {
              clearCompleted();
            }
          }}
          className="px-3 py-1 rounded-full font-bold text-white bg-[#ff8f6b] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          清理已完成
        </button>
        <span className="text-[10px] text-[#7b6f8c] self-center ml-1">
          {canDrag ? '拖动任务可手动排序 · Shift+点击可范围选择' : '切换到手动排序且清空筛选后可拖动 · Shift+点击可范围选择'}
        </span>
      </div>
    </div>
  );
};

export default FiltersBar;
