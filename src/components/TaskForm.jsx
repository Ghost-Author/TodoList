import React from 'react';
import { Plus, X } from 'lucide-react';

const TaskForm = ({
  addTask,
  input,
  setInput,
  note,
  setNote,
  dueDate,
  setDueDate,
  priority,
  setPriority,
  priorities,
  category,
  setCategory,
  categories,
  isManagingCats,
  setIsManagingCats,
  newCatInput,
  setNewCatInput,
  addCategory,
  removeCategory,
  tags,
  setTags,
  tagInput,
  setTagInput
}) => {
  return (
    <form onSubmit={addTask} className="card-soft p-6 mb-8 space-y-6">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="这一刻想完成什么？"
        className="w-full text-lg font-bold outline-none border-b-2 border-transparent focus:border-[#ff8acb] transition-colors py-2 bg-transparent text-[#3b2e4a]"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-1.5 h-full">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">详细备注</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="输入具体执行步骤..."
            className="w-full text-sm bg-white/70 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#ffd7ea] flex-grow min-h-[120px] resize-none transition-all border border-[#ffe4f2]"
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">截止日期</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm bg-white/70 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#ffd7ea] ring-1 ring-[#ffe4f2]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">优先级</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white/70 text-xs font-bold p-2.5 rounded-xl outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea] h-[42px]"
              >
                {Object.entries(priorities).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">分类</label>
                <button type="button" onClick={() => setIsManagingCats(!isManagingCats)} className="text-[10px] text-[#ff6fb1] font-bold hover:underline">管理</button>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/70 text-xs font-bold p-2.5 rounded-xl outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea] h-[42px]"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">标签</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="输入标签后回车"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmed = tagInput.trim();
                    if (trimmed && !tags.includes(trimmed)) {
                      setTags([...tags, trimmed]);
                      setTagInput('');
                    }
                  }
                }}
                className="flex-1 text-xs bg-white/70 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = tagInput.trim();
                  if (trimmed && !tags.includes(trimmed)) {
                    setTags([...tags, trimmed]);
                    setTagInput('');
                  }
                }}
                className="pill-soft px-3 rounded-xl text-xs font-bold"
              >
                添加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((t) => (
                  <span key={t} className="pill-soft px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                    #{t}
                    <button type="button" onClick={() => setTags(tags.filter(tag => tag !== t))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isManagingCats && (
        <div className="card-soft-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-[#3b2e4a]">分类管理</h4>
            <button type="button" onClick={() => setIsManagingCats(false)}><X className="w-4 h-4 text-[#ff9ccc]" /></button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(cat => (
              <span key={cat} className="bg-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-600 shadow-sm border border-[#ffe4f2]">
                {cat}
                <button type="button" onClick={() => removeCategory(cat)} className="text-slate-300 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              placeholder="新分类名称..."
              className="flex-grow text-xs p-2.5 rounded-xl border-none outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea] bg-white/80"
            />
            <button type="button" onClick={addCategory} className="btn-soft px-4 py-2 rounded-xl text-xs font-bold transition-colors">添加</button>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-slate-50">
        <button type="submit" className="w-full md:w-auto btn-soft px-10 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95">
          <Plus className="w-5 h-5" /> 确认录入任务
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
