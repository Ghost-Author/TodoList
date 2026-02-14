import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp, Calendar, StickyNote, Pencil, Save, X, SearchX, Sparkles } from 'lucide-react';

const TaskList = ({
  filteredTasks,
  emptyMode,
  onResetFilters,
  onOpenWheel,
  categories,
  searchQuery,
  taskDensity,
  groupCompleted,
  completedCollapsed,
  setCompletedCollapsed,
  sectionCollapsedMap,
  setSectionCollapsedMap,
  toggleSelect,
  selectedIds,
  toggleTask,
  expandedId,
  setExpandedId,
  priorities,
  deleteTask,
  editTask,
  canDrag,
  handleDragStart,
  handleDrop
}) => {
  const compact = taskDensity === 'compact';
  const orderedIds = filteredTasks.map((t) => t.id);
  const sectionState = sectionCollapsedMap || {};
  const [editingId, setEditingId] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [virtualScrollTop, setVirtualScrollTop] = useState(0);
  const [virtualViewportHeight, setVirtualViewportHeight] = useState(560);
  const [editDraft, setEditDraft] = useState({
    input: '',
    note: '',
    dueDate: '',
    priority: 'medium',
    category: '',
    tags: []
  });
  const [editTagInput, setEditTagInput] = useState('');
  const normalizedQuery = searchQuery.trim();

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

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderHighlighted = (text, className = '') => {
    const raw = String(text || '');
    if (!normalizedQuery) return <span className={className}>{raw}</span>;
    const matcher = new RegExp(`(${escapeRegExp(normalizedQuery)})`, 'ig');
    const needle = normalizedQuery.toLowerCase();
    const parts = raw.split(matcher);
    return (
      <span className={className}>
        {parts.map((part, idx) => (
          part.toLowerCase() === needle
            ? <mark key={`${part}-${idx}`} className="bg-[#ffe597] text-[#3b2e4a] rounded px-0.5">{part}</mark>
            : <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>
        ))}
      </span>
    );
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

  const handleEditHotkey = (e, taskId) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void saveEdit(taskId);
    }
  };

  const toDateInput = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const setEditDueDateQuick = (kind) => {
    if (kind === 'clear') {
      setEditDraft((prev) => ({ ...prev, dueDate: '' }));
      return;
    }
    const d = new Date();
    if (kind === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (kind === 'weekend') {
      const day = d.getDay();
      const delta = day === 0 ? 0 : (6 - day);
      d.setDate(d.getDate() + delta);
    }
    setEditDraft((prev) => ({ ...prev, dueDate: toDateInput(d) }));
  };

  const getDueMeta = (dueDate, completed) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return { label: dueDate, tone: 'normal' };
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (!completed && diffDays < 0) {
      return { label: `逾期 ${Math.abs(diffDays)} 天`, tone: 'overdue' };
    }
    if (diffDays === 0) return { label: '今天截止', tone: completed ? 'normal' : 'today' };
    if (diffDays === 1) return { label: '明天截止', tone: completed ? 'normal' : 'soon' };
    if (diffDays > 1) return { label: `${diffDays} 天后`, tone: 'normal' };
    return { label: dueDate, tone: 'normal' };
  };

  const getDueBucket = (dueDate) => {
    if (!dueDate) return 'noDate';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return 'noDate';
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'week';
    return 'later';
  };

  const getPriorityMeta = (key) => {
    if (priorities && priorities[key]) return priorities[key];
    if (priorities && priorities.medium) return priorities.medium;
    return { label: '普通', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' };
  };

  useEffect(() => {
    setVirtualScrollTop(0);
  }, [searchQuery, groupCompleted, canDrag, taskDensity, filteredTasks.length]);

  if (filteredTasks.length === 0) {
    const isFilteredEmpty = emptyMode === 'filtered';
    return (
      <div className="empty-soft py-12 md:py-16 px-5 md:px-6">
        <div className="max-w-md mx-auto text-center">
          <div className="empty-illustration" aria-hidden="true">
            <span className="empty-illustration-dot empty-illustration-dot-a" />
            <span className="empty-illustration-dot empty-illustration-dot-b" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 border border-[#ffe4f2] text-[10px] font-black tracking-[0.14em] uppercase text-[#7b6f8c]">
            {isFilteredEmpty ? <SearchX className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {isFilteredEmpty ? '筛选结果为空' : '开始第一件事'}
          </div>
          <p className="text-[#7b6f8c] text-sm font-semibold mt-3">
            {isFilteredEmpty ? '没有匹配任务，换个筛选试试' : '清单还没有任务，先从一件小事开始'}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            {isFilteredEmpty
              ? (searchQuery.trim() ? '你可以清空搜索词，或切换筛选/排序条件。' : '你可以切换筛选状态或排序方式。')
              : '不确定做什么时，可以先去转盘获得一个轻量行动。'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {isFilteredEmpty ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="pill-soft px-3 py-1 rounded-full text-xs font-bold"
              >
                一键清空筛选
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenWheel?.()}
                className="pill-soft px-3 py-1 rounded-full text-xs font-bold"
              >
                去转盘找灵感
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const setSectionCollapsed = (updater) => {
    if (typeof setSectionCollapsedMap === 'function') {
      setSectionCollapsedMap(updater);
    }
  };

  const renderTask = (task) => (
        <div
          key={task.id}
          className={`group task-appear flex flex-col transition-all duration-300 ${task.completed ? 'task-card-done' : 'task-card-soft'}`}
          draggable={canDrag}
          onDragStart={() => handleDragStart(task.id)}
          onDragOver={(e) => canDrag && e.preventDefault()}
          onDrop={() => handleDrop(task.id)}
        >
          <div className={`flex items-center ${compact ? 'gap-3 p-3' : 'gap-4 p-4'}`}>
            <button
              onClick={(e) => toggleSelect(task.id, {
                shiftKey: e.shiftKey,
                orderedIds
              })}
              className={`${compact ? 'h-[18px] w-[18px]' : 'h-5 w-5'} hit-soft rounded-md border flex items-center justify-center text-xs font-black ${selectedIds.has(task.id) ? 'bg-[#ff8acb] text-white border-[#ff8acb]' : 'bg-white border-[#ffe4f2] text-[#7b6f8c]'}`}
              title="选择任务"
            >
              {selectedIds.has(task.id) ? '✓' : ''}
            </button>
            <button onClick={() => toggleTask(task.id)} className={`hit-soft flex-shrink-0 transition-transform active:scale-90 ${task.completed ? 'text-[#ff6fb1]' : 'text-slate-300 hover:text-[#ff8acb]'}`}>
              {task.completed ? <CheckCircle2 className={compact ? 'w-6 h-6' : 'w-7 h-7'} /> : <Circle className={compact ? 'w-6 h-6' : 'w-7 h-7'} />}
            </button>

            <div className="flex-grow min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}>
              <div className="flex items-center gap-1.5 mb-1.5 overflow-hidden">
                {(() => {
                  const priorityMeta = getPriorityMeta(task.priority);
                  return (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded whitespace-nowrap ${priorityMeta.bg} ${priorityMeta.color} border ${priorityMeta.border}`}>
                      {priorityMeta.label}
                    </span>
                  );
                })()}
                {task.dueDate && (() => {
                  const meta = getDueMeta(task.dueDate, task.completed);
                  const dueTone = meta?.tone || 'normal';
                  const dueClass = dueTone === 'overdue'
                    ? 'bg-red-100 text-red-600'
                    : dueTone === 'today'
                      ? 'bg-amber-100 text-amber-600'
                      : dueTone === 'soon'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-slate-100 text-slate-500';
                  return (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap ${dueClass}`}
                      title={task.dueDate}
                    >
                      <Calendar className="w-3 h-3" /> {meta?.label || task.dueDate}
                    </span>
                  );
                })()}
                <span className="text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded font-black border border-slate-100">
                  {task.category}
                </span>
                {(task.tags || []).slice(0, 1).map((t) => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded font-black pill-soft">
                    #{t}
                  </span>
                ))}
                {(task.tags || []).length > 1 && (
                  <span className="tag-more relative text-[9px] px-1.5 py-0.5 rounded font-black text-[#7b6f8c] bg-white/70 border border-[#ffe4f2]">
                    +{(task.tags || []).length - 1}
                    <span className="tag-more-pop">
                      {(task.tags || []).slice(1).join(' / ')}
                    </span>
                  </span>
                )}
              </div>
              <p className={`${compact ? 'text-[15px]' : 'text-base'} font-bold task-title-clamp transition-all ${task.completed ? 'line-through text-slate-400' : 'text-[#3b2e4a] group-hover:text-[#ff6fb1]'}`}>
                {renderHighlighted(task.text)}
              </p>
            </div>

            <div className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
              <button onClick={() => setExpandedId(expandedId === task.id ? null : task.id)} className={`hit-soft p-2 transition-colors ${expandedId === task.id ? 'text-[#ff6fb1]' : 'text-slate-300'}`}>
                {expandedId === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button onClick={() => deleteTask(task.id)} className="hit-soft p-2 text-slate-300 hover:text-red-500 transition-colors">
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
                      onKeyDown={(e) => handleEditHotkey(e, task.id)}
                      className="w-full text-sm bg-white/85 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                      placeholder="任务标题"
                    />
                    <textarea
                      value={editDraft.note}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, note: e.target.value }))}
                      onKeyDown={(e) => handleEditHotkey(e, task.id)}
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
                      <div className="md:col-span-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setEditDueDateQuick('today')} className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold">今天</button>
                        <button type="button" onClick={() => setEditDueDateQuick('tomorrow')} className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold">明天</button>
                        <button type="button" onClick={() => setEditDueDateQuick('weekend')} className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold">本周末</button>
                        <button type="button" onClick={() => setEditDueDateQuick('clear')} className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold">清空</button>
                      </div>
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
                          handleEditHotkey(e, task.id);
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') return;
                          if (e.key === 'Escape') return;
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
                    <div className="text-[10px] text-slate-400">
                      快捷键：`Ctrl/Cmd + Enter` 保存，`Esc` 取消
                    </div>
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
                      {task.note ? renderHighlighted(task.note) : '暂无备注内容'}
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
                {editingId !== task.id && task.dueDate && (
                  <div className="mt-1 text-[10px] text-slate-400">
                    截止日期：{task.dueDate}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
  );
  const activeTasks = filteredTasks.filter((task) => !task.completed);
  const completedTasks = filteredTasks.filter((task) => task.completed);
  const activeTaskSections = (() => {
    if (!groupCompleted) return [];
    const sections = {
      overdue: [],
      today: [],
      week: [],
      later: [],
      noDate: []
    };
    activeTasks.forEach((task) => {
      sections[getDueBucket(task.dueDate)].push(task);
    });
    return [
      { key: 'overdue', label: '逾期任务', tone: 'text-red-500', tasks: sections.overdue },
      { key: 'today', label: '今天截止', tone: 'text-amber-500', tasks: sections.today },
      { key: 'week', label: '本周内', tone: 'text-orange-500', tasks: sections.week },
      { key: 'later', label: '之后处理', tone: 'text-[#7b6f8c]', tasks: sections.later },
      { key: 'noDate', label: '未设置日期', tone: 'text-slate-500', tasks: sections.noDate }
    ].filter((section) => section.tasks.length > 0);
  })();

  if (!groupCompleted) {
    const virtualizationEnabled = !canDrag && !editingId && !expandedId && filteredTasks.length > 120;
    if (virtualizationEnabled) {
      const itemHeight = compact ? 84 : 102;
      const overscan = 6;
      const safeViewport = Math.max(virtualViewportHeight || 560, 120);
      const startIndex = Math.max(0, Math.floor(virtualScrollTop / itemHeight) - overscan);
      const visibleCount = Math.ceil(safeViewport / itemHeight) + overscan * 2;
      const endIndex = Math.min(filteredTasks.length, startIndex + visibleCount);
      const topSpacer = startIndex * itemHeight;
      const bottomSpacer = Math.max(0, (filteredTasks.length - endIndex) * itemHeight);
      const visibleTasks = filteredTasks.slice(startIndex, endIndex);
      return (
        <div
          onScroll={(e) => {
            setVirtualScrollTop(e.currentTarget.scrollTop);
            setVirtualViewportHeight(e.currentTarget.clientHeight);
          }}
          className="space-y-4 max-h-[70vh] overflow-auto pr-1"
        >
          <div style={{ height: `${topSpacer}px` }} />
          {visibleTasks.map((task) => renderTask(task))}
          <div style={{ height: `${bottomSpacer}px` }} />
        </div>
      );
    }
    return <div className="space-y-4">{filteredTasks.map((task) => renderTask(task))}</div>;
  }

  return (
    <div className="space-y-4">
      {activeTasks.length > 0 && (
        canDrag ? activeTasks.map((task) => renderTask(task)) : (
          <>
            {activeTaskSections.length > 1 && (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSectionCollapsed(() => {
                    const next = {};
                    activeTaskSections.forEach((section) => {
                      next[section.key] = false;
                    });
                    return next;
                  })}
                  className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold"
                >
                  展开全部分段
                </button>
                <button
                  type="button"
                  onClick={() => setSectionCollapsed(() => {
                    const next = {};
                    activeTaskSections.forEach((section) => {
                      next[section.key] = true;
                    });
                    return next;
                  })}
                  className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold"
                >
                  收起全部分段
                </button>
              </div>
            )}
            {activeTaskSections.map((section) => {
              const collapsed = Boolean(sectionState[section.key]);
              return (
                <div key={section.key} className="surface-soft p-3">
                  <button
                    type="button"
                    onClick={() => setSectionCollapsed((prev) => ({ ...prev, [section.key]: !prev?.[section.key] }))}
                    className="w-full flex items-center justify-between text-left px-2 py-1"
                  >
                    <span className={`text-xs font-black ${section.tone}`}>
                      {section.label} ({section.tasks.length})
                    </span>
                    {collapsed ? (
                      <ChevronDown className="w-4 h-4 text-[#7b6f8c]" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-[#7b6f8c]" />
                    )}
                  </button>
                  {!collapsed && (
                    <div className="mt-2 space-y-3">
                      {section.tasks.map((task) => renderTask(task))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )
      )}

      {completedTasks.length > 0 && (
        <div className="surface-soft p-3">
          <button
            type="button"
            onClick={() => setCompletedCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-between text-left px-2 py-1"
          >
            <span className="text-xs font-black text-[#7b6f8c]">
              已完成任务 ({completedTasks.length})
            </span>
            {completedCollapsed ? (
              <ChevronDown className="w-4 h-4 text-[#7b6f8c]" />
            ) : (
              <ChevronUp className="w-4 h-4 text-[#7b6f8c]" />
            )}
          </button>
          {!completedCollapsed && (
            <div className="mt-2 space-y-3">
              {completedTasks.map((task) => renderTask(task))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskList;
