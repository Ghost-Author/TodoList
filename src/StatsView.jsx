import React from 'react';
import { BarChart3 } from 'lucide-react';

const StatsView = ({ stats }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-soft-sm p-6 flex flex-col items-center">
          <div className="text-4xl font-black text-[#ff6fb1] mb-1">{stats.total}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">任务总量</div>
        </div>
        <div className="card-soft-sm p-6 flex flex-col items-center">
          <div className="text-4xl font-black text-green-500 mb-1">{stats.completed}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">累计完成</div>
        </div>
        <div className="p-6 rounded-3xl flex flex-col items-center text-white btn-soft">
          <div className="text-4xl font-black mb-1">{stats.total - stats.completed}</div>
          <div className="text-[10px] font-black text-white/80 uppercase tracking-widest">剩余待办</div>
        </div>
      </div>

      <div className="card-soft p-8">
        <h3 className="font-bold text-[#3b2e4a] mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#ff6fb1]" /> 分类进度概览
        </h3>
        <div className="space-y-6">
          {stats.catData.map(cat => (
            <div key={cat.name} className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                  <span className="text-xs text-slate-400 ml-2">{cat.done} / {cat.count}</span>
                </div>
                <span className="text-xs font-black text-[#ff6fb1]">{Math.round((cat.done / cat.count) * 100 || 0)}%</span>
              </div>
              <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-[#ffe4f2]">
                <div
                  className="h-full bg-[#ff8acb] transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(255,138,203,0.35)]"
                  style={{ width: `${(cat.done / cat.count) * 100 || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsView;
