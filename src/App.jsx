import React, { useState, useEffect, useMemo, useDeferredValue, Suspense } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Cloud,
  PieChart,
  StickyNote,
  X
} from 'lucide-react';
import { supabase } from './supabaseClient';
const StatsView = React.lazy(() => import('./StatsView.jsx'));

const App = () => {
  // --- State Management ---
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [dragId, setDragId] = useState(null);
  const [captchaFails, setCaptchaFails] = useState(0);
  const [captchaLockUntil, setCaptchaLockUntil] = useState(0);
  const [toast, setToast] = useState('');

  const [input, setInput] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_desc');
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(v => v.trim()).filter(Boolean);
  const isAdmin = session?.user?.email && adminEmails.includes(session.user.email);
  const deferredQuery = useDeferredValue(searchQuery);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [view, setView] = useState('tasks');
  const [expandedId, setExpandedId] = useState(null);
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  
  // --- Auth ---
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.title = '云朵清单';
  }, []);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const text = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const canvas = document.createElement('canvas');
    canvas.width = 140;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { text, image: '' };

    ctx.fillStyle = '#fff7fb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 5; i += 1) {
      ctx.strokeStyle = `rgba(255, 138, 203, ${0.25 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    ctx.font = 'bold 26px Quicksand, Nunito, Arial Rounded MT Bold, sans-serif';
    ctx.fillStyle = '#3b2e4a';
    [...text].forEach((ch, i) => {
      const angle = (Math.random() - 0.5) * 0.4;
      const x = 12 + i * 24;
      const y = 32 + (Math.random() * 6 - 3);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });

    const image = canvas.toDataURL('image/png');
    return { text, image };
  };

  useEffect(() => {
    const { text, image } = generateCaptcha();
    setCaptchaText(text);
    setCaptchaImage(image);
  }, []);

  const refreshCaptcha = () => {
    const { text, image } = generateCaptcha();
    setCaptchaText(text);
    setCaptchaImage(image);
    setCaptchaInput('');
  };

  useEffect(() => {
    if (!session) {
      setTasks([]);
      setCategories([]);
      setCategory('');
    }
  }, [session]);

  const defaultCategories = ['工作', '生活', '学习', '健康', '其他'];

  const ensureDefaultCategories = async (userId) => {
    const { data: existing, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (existing.length > 0) {
      setCategories(existing.map((c) => c.name));
      return existing;
    }
    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert(defaultCategories.map((name) => ({ name, user_id: userId })))
      .select('id, name')
      .order('created_at', { ascending: true });
    if (insertError) throw insertError;
    setCategories(inserted.map((c) => c.name));
    return inserted;
  };

  const loadTasks = async (userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, text, note, due_date, priority, category, tags, order_index, completed, created_at')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    setTasks(
      data.map((task) => ({
        id: task.id,
        text: task.text,
        note: task.note || '',
        dueDate: task.due_date || '',
        priority: task.priority || 'medium',
        category: task.category || '',
        tags: task.tags || [],
        orderIndex: task.order_index ?? 0,
        completed: task.completed,
        createdAt: task.created_at
      }))
    );
  };

  useEffect(() => {
    if (!supabase || !session?.user?.id) return;
    const userId = session.user.id;
    Promise.all([ensureDefaultCategories(userId), loadTasks(userId)])
      .then(([cats]) => {
        if (!category && cats.length > 0) {
          setCategory(cats[0].name);
        }
      })
      .catch(() => {
        // keep UI usable even if remote load fails
      });
  }, [session]);

  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // --- Task & Category Logic ---
  const priorities = {
    high: { label: '重要且紧急', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
    medium: { label: '重要不紧急', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    low: { label: '不重要但紧急', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    none: { label: '不重要不紧急', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100' }
  };

  const addTask = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || !session?.user?.id) return;
    const taskCategory = category || categories[0] || '';
    const minOrder = tasks.length ? Math.min(...tasks.map((t) => t.orderIndex ?? 0)) : 0;
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: session.user.id,
        text: trimmedInput,
        note: note.trim(),
        due_date: dueDate || null,
        priority,
        category: taskCategory,
        tags,
        order_index: minOrder - 1,
        completed: false
      })
      .select('id, text, note, due_date, priority, category, tags, order_index, completed, created_at')
      .single();
    if (error) return;
    setTasks([
      {
        id: data.id,
        text: data.text,
        note: data.note || '',
        dueDate: data.due_date || '',
        priority: data.priority || 'medium',
        category: data.category || taskCategory,
        tags: data.tags || [],
        orderIndex: data.order_index ?? (minOrder - 1),
        completed: data.completed,
        createdAt: data.created_at
      },
      ...tasks
    ]);
    setInput('');
    setNote('');
    setDueDate('');
    setTags([]);
    setTagInput('');
  };

  const addCategory = async () => {
    const trimmed = newCatInput.trim();
    if (!trimmed || categories.includes(trimmed) || !session?.user?.id) return;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: trimmed, user_id: session.user.id })
      .select('name')
      .single();
    if (error) return;
    setCategories([...categories, data.name]);
    setNewCatInput('');
  };

  const removeCategory = async (cat) => {
    if (categories.length <= 1 || !session?.user?.id) return;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', session.user.id)
      .eq('name', cat);
    if (error) return;
    const next = categories.filter(c => c !== cat);
    setCategories(next);
    if (category === cat) setCategory(next[0] || '');
  };

  const toggleTask = async (id) => {
    const target = tasks.find(t => t.id === id);
    if (!target || !session?.user?.id) return;
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !target.completed })
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) return;
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = async (id) => {
    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) return;
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
  };

  const bulkComplete = async (completed) => {
    if (!session?.user?.id || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('tasks')
      .update({ completed })
      .in('id', ids)
      .eq('user_id', session.user.id);
    if (error) return;
    setTasks(tasks.map(t => selectedIds.has(t.id) ? { ...t, completed } : t));
    clearSelection();
  };

  const bulkDelete = async () => {
    if (!session?.user?.id || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids)
      .eq('user_id', session.user.id);
    if (error) return;
    setTasks(tasks.filter(t => !selectedIds.has(t.id)));
    clearSelection();
  };

  const canDrag = filter === 'all' && !searchQuery.trim() && sortBy === 'manual';

  const handleDragStart = (id) => {
    if (!canDrag) return;
    setDragId(id);
  };

  const handleDrop = async (targetId) => {
    if (!canDrag || !dragId || dragId === targetId) return;
    const ordered = [...tasks].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const fromIndex = ordered.findIndex((t) => t.id === dragId);
    const toIndex = ordered.findIndex((t) => t.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
    const updated = ordered.map((t, idx) => ({ ...t, orderIndex: idx }));
    setTasks(updated);
    setDragId(null);
    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('tasks')
      .upsert(updated.map((t) => ({ id: t.id, user_id: session.user.id, order_index: t.orderIndex })), { onConflict: 'id' });
    if (!error) {
      setToast('排序已保存');
      setTimeout(() => setToast(''), 1500);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (captchaLockUntil > Date.now()) {
      setAuthError('验证码错误次数过多，请稍后再试');
      return;
    }
    if (!email.trim() || !password) {
      setAuthError('请输入邮箱和密码');
      return;
    }
    if (captchaInput.trim().toUpperCase() !== captchaText) {
      setAuthError('验证码不正确');
      setCaptchaFails((v) => {
        const next = v + 1;
        if (next >= 5) {
          setCaptchaLockUntil(Date.now() + 60 * 1000);
        }
        return next;
      });
      refreshCaptcha();
      return;
    }
    setCaptchaFails(0);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        setAuthError('注册成功，请检查邮箱完成验证后登录');
        setAuthMode('signin');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) setAuthError(error.message);
    } finally {
      // One-time captcha: always refresh after submit
      refreshCaptcha();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const sendResetEmail = async () => {
    setAuthError('');
    if (!email.trim()) {
      setAuthError('请输入邮箱以重置密码');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin
    });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthError('已发送重置邮件，请查收');
  };

  const updatePassword = async () => {
    setAuthError('');
    if (!newPassword) {
      setAuthError('请输入新密码');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthError('密码已更新');
    setNewPassword('');
    setRecoveryMode(false);
  };

  const exportData = async () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const [tasksRes, catsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').eq('user_id', userId)
    ]);
    if (tasksRes.error || catsRes.error) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      tasks: tasksRes.data,
      categories: catsRes.data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloud-todo-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const clearAllData = async () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    await supabase.from('tasks').delete().eq('user_id', userId);
    await supabase.from('categories').delete().eq('user_id', userId);
    setTasks([]);
    const cats = await ensureDefaultCategories(userId);
    setCategory(cats[0]?.name || '');
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filter === 'active') result = tasks.filter(t => !t.completed);
    if (filter === 'completed') result = tasks.filter(t => t.completed);
    if (deferredQuery.trim()) {
      const q = deferredQuery.trim().toLowerCase();
      result = result.filter(t => {
        const hay = [
          t.text,
          t.note,
          t.category,
          ...(t.tags || [])
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    const sorter = {
      manual: (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
      created_desc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      created_asc: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      due_asc: (a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'),
      due_desc: (a, b) => new Date(b.dueDate || '0000-01-01') - new Date(a.dueDate || '0000-01-01'),
      priority: (a, b) => {
        const rank = { high: 0, medium: 1, low: 2, none: 3 };
        return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
      }
    }[sortBy];
    if (sorter) result = [...result].sort(sorter);
    return result;
  }, [tasks, filter, deferredQuery, sortBy]);

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

  if (!supabase) {
    return (
      <div className="min-h-screen text-slate-900 pb-24">
        <div className="max-w-md mx-auto p-6 md:p-10">
          <div className="card-soft p-8 mt-16">
            <h1 className="text-3xl font-bold tracking-tight text-[#3b2e4a] flex items-center gap-2 mb-2">
              <Cloud className="w-7 h-7 text-[#ff8acb]" /> 云朵清单
            </h1>
            <p className="text-[#7b6f8c] mb-4">未检测到 Supabase 配置。</p>
            <p className="text-sm text-[#7b6f8c]">
              请在 Vercel 或本地环境变量中设置 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#7b6f8c]">
        加载中...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen text-slate-900 pb-24">
        <div className="max-w-md mx-auto p-6 md:p-10">
          <div className="card-soft p-8 mt-16">
            <h1 className="text-3xl font-bold tracking-tight text-[#3b2e4a] flex items-center gap-2 mb-2">
              <Cloud className="w-7 h-7 text-[#ff8acb]" /> 云朵清单
            </h1>
            <p className="text-[#7b6f8c] mb-6">登录后即可同步你的清单。</p>
            {recoveryMode ? (
              <div className="space-y-4">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="设置新密码"
                  className="w-full text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                />
                {authError && (
                  <div className="text-xs text-[#ff6fb1]">{authError}</div>
                )}
                <button type="button" onClick={updatePassword} className="w-full btn-soft py-3 rounded-2xl font-bold transition-all">
                  更新密码
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleAuth} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="邮箱"
                    className="w-full text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="密码"
                    className="w-full text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                  />
                  <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      placeholder="验证码"
                      className="flex-1 text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                    />
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="px-2 py-2 rounded-xl bg-white/80 border border-[#ffe4f2] text-[#3b2e4a]"
                      title="点击刷新验证码"
                    >
                      {captchaImage ? (
                        <img src={captchaImage} alt="captcha" className="h-8 w-28 object-contain" />
                      ) : (
                        <span className="font-black tracking-[0.2em]">{captchaText}</span>
                      )}
                    </button>
                  </div>
                  {captchaFails >= 3 && (
                    <div className="text-[10px] text-[#ff6fb1]">
                      连续输错多次，请刷新验证码后再试
                    </div>
                  )}
                  {captchaLockUntil > Date.now() && (
                    <div className="text-[10px] text-[#ff6fb1]">
                      请稍后再试（约 {Math.ceil((captchaLockUntil - Date.now()) / 1000)} 秒）
                    </div>
                  )}
                  {authError && (
                    <div className="text-xs text-[#ff6fb1]">{authError}</div>
                  )}
                  <button type="submit" className="w-full btn-soft py-3 rounded-2xl font-bold transition-all">
                    {authMode === 'signup' ? '注册' : '登录'}
                  </button>
                </form>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                      setAuthError('');
                    }}
                    className="text-[#7b6f8c] hover:text-[#ff6fb1]"
                  >
                    {authMode === 'signup' ? '已有账号？去登录' : '没有账号？去注册'}
                  </button>
                  <button
                    type="button"
                    onClick={sendResetEmail}
                    className="text-[#7b6f8c] hover:text-[#ff6fb1]"
                  >
                    忘记密码
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        
        {/* Nav Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="card-soft-sm p-1 flex">
            <button onClick={() => setView('tasks')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'tasks' ? 'tab-active' : 'tab-inactive hover:text-[#ff6fb1]'}`}>
              <LayoutGrid className="w-4 h-4" /> 任务清单
            </button>
            <button onClick={() => setView('stats')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'stats' ? 'tab-active' : 'tab-inactive hover:text-[#ff6fb1]'}`}>
              <PieChart className="w-4 h-4" /> 小成就
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            {isAdmin && (
              <a href="/admin.html" className="text-[#7b6f8c] hover:text-[#ff6fb1]">
                后台
              </a>
            )}
            <button onClick={() => setShowSettings(true)} className="text-[#7b6f8c] hover:text-[#ff6fb1]">
              设置
            </button>
            <button onClick={signOut} className="text-[#7b6f8c] hover:text-[#ff6fb1]">
              退出登录
            </button>
          </div>
        </div>

        {!session.user.email_confirmed_at && (
          <div className="card-soft-sm px-4 py-3 mb-6 text-sm text-[#7b6f8c]">
            你的邮箱尚未验证，请前往邮箱完成验证以确保账号安全。
          </div>
        )}

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

            {/* Task Items */}
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="py-20 text-center bg-white/70 rounded-3xl border border-dashed border-[#ffd7ea]">
                  <p className="text-slate-400 text-sm">清单空空如也，给自己一个拥抱吧</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className={`group flex flex-col transition-all duration-300 ${task.completed ? 'bg-slate-100/50 border-slate-200 opacity-60 rounded-2xl' : 'card-soft-sm'}`}
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
          <Suspense fallback={<div className="text-sm text-[#7b6f8c]">加载统计中...</div>}>
            <StatsView stats={stats} />
          </Suspense>
        )}

        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
            <div className="card-soft w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#3b2e4a]">设置</h3>
                <button onClick={() => setShowSettings(false)} className="text-[#ff9ccc]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-xs text-[#7b6f8c]">修改密码</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="新密码"
                      className="flex-1 bg-white/80 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                    />
                    <button type="button" onClick={updatePassword} className="btn-soft px-4 rounded-xl font-bold">
                      更新
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={exportData} className="pill-soft px-4 py-2 rounded-xl font-bold">
                    导出数据
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('确定要清空所有数据吗？此操作不可恢复。')) {
                        clearAllData();
                      }
                    }}
                    className="px-4 py-2 rounded-xl font-bold text-white bg-[#ff7aa8]"
                  >
                    清空数据
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrivacy(true);
                    setShowSettings(false);
                  }}
                  className="text-[#7b6f8c] hover:text-[#ff6fb1] underline"
                >
                  查看隐私政策
                </button>
              </div>
            </div>
          </div>
        )}

        {showPrivacy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
            <div className="card-soft w-full max-w-2xl p-6 max-h-[80vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#3b2e4a]">隐私政策</h3>
                <button onClick={() => setShowPrivacy(false)} className="text-[#ff9ccc]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-[#7b6f8c] leading-relaxed">
                <p>云朵清单仅收集账号邮箱与您主动填写的任务内容，用于账号登录与数据同步。</p>
                <p>数据存储于 Supabase（数据库与认证服务），并通过行级权限控制仅允许账号本人访问。</p>
                <p>我们使用 Sentry 进行错误监控，可能收集设备与浏览器信息以帮助定位问题。</p>
                <p>您可以在设置中导出或清空自己的数据。如需注销账号，可联系我们处理。</p>
                <p>如有疑问请联系：liupggg@gmail.com</p>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 border border-[#ffe4f2] px-4 py-2 rounded-full text-xs text-[#3b2e4a] shadow-sm">
            {toast}
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
