import React from 'react';

const SummaryCards = ({ data }) => {
  if (!data) return null;

  const taskCount = Number(data.taskCount) || 0;
  const completedCount = Number(data.completedCount) || 0;
  const overdueCount = Number(data.overdueCount) || 0;
  const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
  const overdueRate = taskCount > 0 ? Math.round((overdueCount / taskCount) * 100) : 0;

  const cards = [
    { key: 'users', label: '用户', value: data.userCount, tone: 'text-[#ff6fb1]' },
    { key: 'tasks', label: '任务', value: taskCount, tone: 'text-[#ff6fb1]' },
    { key: 'completed', label: '已完成', value: completedCount, tone: 'text-green-500' },
    { key: 'active', label: '进行中', value: data.activeCount, tone: 'text-[#ff6fb1]' },
    { key: 'overdue', label: '已逾期', value: overdueCount, tone: 'text-[#ff6fb1]' },
    { key: 'priority', label: '高优先级', value: data.highPriorityCount, tone: 'text-[#ff6fb1]' },
    { key: 'category', label: '分类', value: data.categoryCount, tone: 'text-[#ff6fb1]' },
    { key: 'completionRate', label: '完成率', value: `${completionRate}%`, tone: 'text-[#5f5ce6]', hint: '已完成 / 总任务' },
    { key: 'overdueRate', label: '逾期率', value: `${overdueRate}%`, tone: overdueRate > 30 ? 'text-red-500' : 'text-amber-600', hint: '逾期 / 总任务' }
  ];

  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.key} className="card-soft-sm p-3 md:p-4 text-center">
          <div className={`text-xl md:text-2xl font-black ${card.tone}`}>{card.value ?? 0}</div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{card.label}</div>
          {card.hint && <div className="text-[10px] text-[#9a8faf] mt-1">{card.hint}</div>}
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
