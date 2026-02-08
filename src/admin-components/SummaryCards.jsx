import React from 'react';

const SummaryCards = ({ data }) => {
  if (!data) return null;
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card-soft-sm p-4 text-center">
        <div className="text-2xl font-black text-[#ff6fb1]">{data.userCount}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">用户</div>
      </div>
      <div className="card-soft-sm p-4 text-center">
        <div className="text-2xl font-black text-[#ff6fb1]">{data.taskCount}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">任务</div>
      </div>
      <div className="card-soft-sm p-4 text-center">
        <div className="text-2xl font-black text-green-500">{data.completedCount}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已完成</div>
      </div>
      <div className="card-soft-sm p-4 text-center">
        <div className="text-2xl font-black text-[#ff6fb1]">{data.categoryCount}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分类</div>
      </div>
      <div className="card-soft-sm p-4 text-center">
        <div className="text-2xl font-black text-[#ff6fb1]">{data.activeCount}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">进行中</div>
      </div>
      <div className="card-soft-sm p-4 text-center">
        <div className="text-2xl font-black text-[#ff6fb1]">{data.overdueCount}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已逾期</div>
      </div>
      <div className="card-soft-sm p-4 text-center">
        <div className="text-2xl font-black text-[#ff6fb1]">{data.highPriorityCount}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">高优先级</div>
      </div>
    </div>
  );
};

export default SummaryCards;
