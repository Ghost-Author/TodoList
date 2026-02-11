import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp, Calendar, StickyNote, Pencil, Save, X } from 'lucide-react';

const TaskList = ({
  filteredTasks,
  emptyMode,
  onResetFilters,
  categories,
  toggleSelect,
  selectedIds,
  toggleTask,
  expandedId,
  setExpandedId,
  priorities,
  isOverdue,
  deleteTask,
  editTask,
  canDrag,
  handleDragStart,
  handleDrop
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editDraft, setEditDraft] = useState({
    input: '',
    note: '',
    dueDate: '',
    priority: 'medium',
    category: '',
    tags: []
  });
  const [editTagInput, setEditTagInput] = useState('');

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

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditDraft({
      input: task.text || '',
      note: task.note || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'medium',
      category: task.category || categories?.[0] || '',
      tags: Array.isArray(task.tags) ? task.tags : []
    });
    setEditTagInput('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSaving(false);
    setEditTagInput('');
  };

  const addEditTag = () => {
    const val = editTagInput.trim();
    if (!val) return;
    if (editDraft.tags.includes(val)) return;
    setEditDraft((prev) => ({ ...prev, tags: [...prev.tags, val] }));
    setEditTagInput('');
  };

  const saveEdit = async (taskId) => {
    if (editSaving) return;
    setEditSaving(true);
    const ok = await editTask(taskId, editDraft);
    setEditSaving(false);
    if (ok) {
      setEditingId(null);
      setEditTagInput('');
    }
  };

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
                {editingId === task.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> 编辑任务
                      </h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold"
                        >
                          <X className="w-3 h-3 inline" /> 取消
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(task.id)}
                          disabled={editSaving || !editDraft.input.trim()}
                          className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-3 h-3 inline" /> {editSaving ? '保存中...' : '保存'}
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={editDraft.input}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, input: e.target.value }))}
                      className="w-full text-sm bg-white/85 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                      placeholder="任务标题"
                    />
                    <textarea
                      value={editDraft.note}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, note: e.target.value }))}
                      className="w-full text-sm bg-white/85 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea] min-h-[88px] resize-none"
                      placeholder="详细备注"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="date"
                        value={editDraft.dueDate}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
                        className="text-xs bg-white/85 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                      />
                      <select
                        value={editDraft.priority}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, priority: e.target.value }))}
                        className="text-xs bg-white/85 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                      >
                        {Object.entries(priorities).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <select
                        value={editDraft.category}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, category: e.target.value }))}
                        className="text-xs bg-white/85 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                      >
                        <option value="">未分类</option>
                        {Array.from(new Set([editDraft.category, ...(categories || [])].filter(Boolean))).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editTagInput}
                        onChange={(e) => setEditTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEditTag();
                          }
                        }}
                        placeholder="输入标签后回车"
                        className="flex-1 text-xs bg-white/85 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                      />
                      <button type="button" onClick={addEditTag} className="pill-soft px-3 py-1 rounded-full text-xs font-bold">添加标签</button>
                    </div>
                    {editDraft.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editDraft.tags.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setEditDraft((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== t) }))}
                            className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold"
                          >
                            #{t} ×
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" /> 详细备忘
                      </h4>
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold"
                      >
                        <Pencil className="w-3 h-3 inline" /> 编辑
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {task.note || '暂无备注内容'}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-medium text-slate-400">录入时间: {new Date(task.createdAt).toLocaleString()}</span>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 pill-soft rounded-full">{task.category}</span>
                      </div>
                    </div>
                  </>
                )}
                {editingId !== task.id && (
                  <div className="mt-2 text-[10px] text-slate-400">
                    标签：{(task.tags || []).length > 0 ? task.tags.join(' / ') : '无'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
  );

  return <div className="space-y-4">{filteredTasks.map((task) => renderTask(task))}</div>;
};

export default TaskList;
