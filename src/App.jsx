import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  BarChart3, 
  Calendar,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Cloud,
  PieChart,
  StickyNote,
  X
} from 'lucide-react';

const App = () => {
  // --- State Management ---
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('organized_tasks_v3_1');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('custom_categories');
    return saved ? JSON.parse(saved) : ['工作', '生活', '学习', '健康', '其他'];
  });

  const [input, setInput] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState(categories[0]);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('tasks');
  const [expandedId, setExpandedId] = useState(null);
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  
  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('organized_tasks_v3_1', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('custom_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    document.title = '云朵清单';
  }, []);

  // --- Task & Category Logic ---
  const priorities = {
    high: { label: '重要且紧急', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
    medium: { label: '重要不紧急', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    low: { label: '不重要但紧急', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    none: { label: '不重要不紧急', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100' }
  };

  const addTask = (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    const newTask = {
      id: Date.now(),
      text: trimmedInput,
      note: note.trim(),
      dueDate: dueDate,
      priority,
      category,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTasks([newTask, ...tasks]);
    setInput('');
    setNote('');
    setDueDate('');
  };

  const addCategory = () => {
    if (newCatInput.trim() && !categories.includes(newCatInput.trim())) {
      setCategories([...categories, newCatInput.trim()]);
      setNewCatInput('');
    }
  };

  const removeCategory = (cat) => {
    if (categories.length > 1) {
      setCategories(categories.filter(c => c !== cat));
      if (category === cat) setCategory(categories[0]);
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filter === 'active') result = tasks.filter(t => !t.completed);
    if (filter === 'completed') result = tasks.filter(t => t.completed);
    return result;
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
    const catData = categories.map(cat => ({
      name: cat,
      count: tasks.filter(t => t.category === cat).length,
      done: tasks.filter(t => t.category === cat && t.completed).length
    }));
    return { total, completed, highPriority, catData };
  }, [tasks, categories]);

  return (
    <div className="min-h-screen text-slate-900 pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        
        {/* Nav Tabs */}
        <div className="flex justify-center mb-8">
          <div className="card-soft-sm p-1 flex">
            <button onClick={() => setView('tasks')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'tasks' ? 'tab-active' : 'tab-inactive hover:text-[#ff6fb1]'}`}>
              <LayoutGrid className="w-4 h-4" /> 任务清单
            </button>
            <button onClick={() => setView('stats')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'stats' ? 'tab-active' : 'tab-inactive hover:text-[#ff6fb1]'}`}>
              <PieChart className="w-4 h-4" /> 小成就
            </button>
          </div>
        </div>

        {view === 'tasks' ? (
          <>
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="lg:col-span-2 flex flex-col justify-end">
                <h1 className="text-3xl font-bold tracking-tight text-[#3b2e4a] flex items-center gap-2">
                  <Cloud className="w-7 h-7 text-[#ff8acb]" /> 云朵清单
                </h1>
                <p className="text-[#7b6f8c] mt-1">把每件事放进软绵绵的小云朵里。</p>
              </div>
            </div>

            {/* Expanded Add Form */}
            <form onSubmit={addTask} className="card-soft p-6 mb-8 space-y-6">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="这一刻想完成什么？"
                className="w-full text-lg font-bold outline-none border-b-2 border-transparent focus:border-[#ff8acb] transition-colors py-2 bg-transparent text-[#3b2e4a]"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Side: Note */}
                <div className="flex flex-col gap-1.5 h-full">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">详细备注</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="输入具体执行步骤..."
                    className="w-full text-sm bg-white/70 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#ffd7ea] flex-grow min-h-[120px] resize-none transition-all border border-[#ffe4f2]"
                  />
                </div>

                {/* Right Side: Options */}
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
                </div>
              </div>

              {/* Category Manager Overlay */}
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

            {/* List Controls */}
            <div className="flex gap-6 border-b border-[#ffe4f2] mb-6 overflow-x-auto no-scrollbar">
              {['all', 'active', 'completed'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`pb-3 text-sm font-bold relative whitespace-nowrap transition-colors ${filter === f ? 'text-[#ff6fb1]' : 'text-slate-400 hover:text-[#ff6fb1]'}`}>
                  {f === 'all' ? '全部任务' : f === 'active' ? '进行中' : '已归档'}
                  {filter === f && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#ff8acb] rounded-full" />}
                </button>
              ))}
            </div>

            {/* Task Items */}
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="py-20 text-center bg-white/70 rounded-3xl border border-dashed border-[#ffd7ea]">
                  <p className="text-slate-400 text-sm">清单空空如也，给自己一个拥抱吧</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} className={`group flex flex-col transition-all duration-300 ${task.completed ? 'bg-slate-100/50 border-slate-200 opacity-60 rounded-2xl' : 'card-soft-sm'}`}>
                    <div className="flex items-center gap-4 p-4">
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
                        </div>
                        <p className={`text-base font-bold truncate transition-all ${task.completed ? 'line-through text-slate-400' : 'text-[#3b2e4a] group-hover:text-[#ff6fb1]'}`}>{task.text}</p>
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

                    {/* Expanded Note & Details */}
                    {expandedId === task.id && (
                      <div className="px-4 pb-4 pt-0 border-t border-slate-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="bg-white/70 rounded-xl p-4 mt-2 border border-[#ffe4f2]">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                            <StickyNote className="w-3 h-3" /> 详细备忘
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {task.note || "暂无备注内容"}
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
                ))
              )}
            </div>
          </>
        ) : (
          /* Stats View */
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
                      <span className="text-xs font-black text-[#ff6fb1]">{Math.round((cat.done/cat.count)*100 || 0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-[#ffe4f2]">
                      <div 
                        className="h-full bg-[#ff8acb] transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(255,138,203,0.35)]"
                        style={{ width: `${(cat.done/cat.count)*100 || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-[#ff9ccc] text-[10px] font-black uppercase tracking-[0.3em]">Soft Focus · Sweet Progress</p>
        </div>

      </div>
    </div>
  );
};

export default App;
