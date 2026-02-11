import React from 'react';
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp, Calendar, StickyNote } from 'lucide-react';

const TaskList = ({
  filteredTasks,
  emptyMode,
  onResetFilters,
  toggleSelect,
  selectedIds,
  toggleTask,
  expandedId,
  setExpandedId,
  priorities,
  isOverdue,
  deleteTask,
  canDrag,
  handleDragStart,
  handleDrop
}) => {
  if (filteredTasks.length === 0) {
    const isFilteredEmpty = emptyMode === 'filtered';
    return (
      <div className="empty-soft py-20 text-center">
        <p className="text-slate-400 text-sm">
          {isFilteredEmpty ? '没有匹配任务，试试调整筛选条件' : '清单空空如也，给自己一个拥抱吧'}
        </p>
        {isFilteredEmpty && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-3 pill-soft px-3 py-1 rounded-full text-xs font-bold"
          >
            一键清空筛选
          </button>
        )}
      </div>
    );
  }

  const renderTask = (task) => (
        <div
          key={task.id}
          className={`group flex flex-col transition-all duration-300 ${task.completed ? 'task-card-done' : 'task-card-soft'}`}
          draggable={canDrag}
          onDragStart={() => handleDragStart(task.id)}
          onDragOver={(e) => canDrag && e.preventDefault()}
          onDrop={() => handleDrop(task.id)}
        >
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => toggleSelect(task.id)}
              className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs font-black ${selectedIds.has(task.id) ? 'bg-[#ff8acb] text-white border-[#ff8acb]' : 'bg-white border-[#ffe4f2] text-[#7b6f8c]'}`}
              title="选择任务"
            >
              {selectedIds.has(task.id) ? '✓' : ''}
            </button>
            <button onClick={() => toggleTask(task.id)} className={`flex-shrink-0 transition-transform active:scale-90 ${task.completed ? 'text-[#ff6fb1]' : 'text-slate-300 hover:text-[#ff8acb]'}`}>
              {task.completed ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
            </button>

            <div className="flex-grow min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}>
              <div className="flex items-center gap-2 mb-1 overflow-hidden">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded whitespace-nowrap ${priorities[task.priority].bg} ${priorities[task.priority].color} border ${priorities[task.priority].border}`}>
                  {priorities[task.priority].label}
                </span>
                {task.dueDate && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap ${isOverdue(task.dueDate) && !task.completed ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Calendar className="w-3 h-3" /> {task.dueDate}
                  </span>
                )}
                <span className="text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded font-black border border-slate-100">
                  {task.category}
                </span>
                {(task.tags || []).slice(0, 3).map((t) => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded font-black pill-soft">
                    #{t}
                  </span>
                ))}
                {(task.tags || []).length > 3 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-black text-[#7b6f8c] bg-white/70 border border-[#ffe4f2]">
                    +{(task.tags || []).length - 3}
                  </span>
                )}
              </div>
              <p className={`text-base font-bold truncate transition-all ${task.completed ? 'line-through text-slate-400' : 'text-[#3b2e4a] group-hover:text-[#ff6fb1]'}`}>
                {task.text}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setExpandedId(expandedId === task.id ? null : task.id)} className={`p-2 transition-colors ${expandedId === task.id ? 'text-[#ff6fb1]' : 'text-slate-300'}`}>
                {expandedId === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {expandedId === task.id && (
            <div className="px-4 pb-4 pt-0 border-t border-slate-50 animate-in slide-in-from-top-2 duration-200">
              <div className="bg-white/70 rounded-xl p-4 mt-2 border border-[#ffe4f2]">
                <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <StickyNote className="w-3 h-3" /> 详细备忘
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {task.note || '暂无备注内容'}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-medium text-slate-400">录入时间: {new Date(task.createdAt).toLocaleString()}</span>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 pill-soft rounded-full">{task.category}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
  );

  return <div className="space-y-4">{filteredTasks.map((task) => renderTask(task))}</div>;
};

export default TaskList;
