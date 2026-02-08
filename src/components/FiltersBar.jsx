import React from 'react';

const FiltersBar = ({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectAllFiltered,
  clearSelection,
  bulkComplete,
  bulkDelete,
  canDrag
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex gap-6 border-b border-[#ffe4f2] overflow-x-auto no-scrollbar">
        {['all', 'active', 'completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`pb-3 text-sm font-bold relative whitespace-nowrap transition-colors ${filter === f ? 'text-[#ff6fb1]' : 'text-slate-400 hover:text-[#ff6fb1]'}`}>
            {f === 'all' ? '全部任务' : f === 'active' ? '进行中' : '已归档'}
            {filter === f && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#ff8acb] rounded-full" />}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索任务/备注/分类/标签"
          className="w-full text-sm bg-white/70 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full text-sm bg-white/70 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
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
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <button type="button" onClick={selectAllFiltered} className="pill-soft px-3 py-1 rounded-full">
          全选当前
        </button>
        <button type="button" onClick={clearSelection} className="pill-soft px-3 py-1 rounded-full">
          取消选择
        </button>
        <button type="button" onClick={() => bulkComplete(true)} className="pill-soft px-3 py-1 rounded-full">
          标记完成
        </button>
        <button type="button" onClick={() => bulkComplete(false)} className="pill-soft px-3 py-1 rounded-full">
          标记未完成
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('确定要删除所选任务吗？')) {
              bulkDelete();
            }
          }}
          className="px-3 py-1 rounded-full font-bold text-white bg-[#ff7aa8]"
        >
          批量删除
        </button>
        <span className="text-[10px] text-[#7b6f8c] self-center">
          {canDrag ? '拖动任务可手动排序' : '切换到手动排序且清空筛选后可拖动'}
        </span>
      </div>
    </div>
  );
};

export default FiltersBar;
