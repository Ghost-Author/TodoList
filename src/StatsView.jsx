import React from 'react';
import { BarChart3 } from 'lucide-react';

const StatsView = ({ stats }) => {
  const cards = [
    { label: '任务总量', value: stats.total, valueClass: 'text-[#ff6fb1]', containerClass: 'card-soft-sm' },
    { label: '累计完成', value: stats.completed, valueClass: 'text-green-500', containerClass: 'card-soft-sm' },
    { label: '剩余待办', value: stats.total - stats.completed, valueClass: 'text-white', containerClass: 'btn-soft rounded-3xl text-white' }
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div
            key={card.label}
            className={`${card.containerClass} stats-card-appear p-6 flex flex-col items-center`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className={`text-4xl font-black mb-1 ${card.valueClass}`}>{card.value}</div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${card.label === '剩余待办' ? 'text-white/80' : 'text-slate-400'}`}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="card-soft stats-card-appear p-8" style={{ animationDelay: '220ms' }}>
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
