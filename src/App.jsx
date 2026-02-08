import React, { useState, useEffect, useMemo, useDeferredValue, Suspense, useRef } from 'react';
import { 
  LayoutGrid,
  Cloud,
  PieChart
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { generateCaptcha } from './utils/captcha.js';
import AuthPanel from './components/AuthPanel.jsx';
import Toast from './components/Toast.jsx';
import EmailVerifyBanner from './components/EmailVerifyBanner.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import PrivacyModal from './components/PrivacyModal.jsx';
import TaskForm from './components/TaskForm.jsx';
import FiltersBar from './components/FiltersBar.jsx';
import TaskList from './components/TaskList.jsx';
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
  const [toast, setToast] = useState(null);
  const [undoData, setUndoData] = useState(null);
  const undoTimerRef = useRef(null);

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

  useEffect(() => {
    const { text, image } = generateCaptcha(5);
    setCaptchaText(text);
    setCaptchaImage(image);
  }, []);

  const refreshCaptcha = (lengthOverride) => {
    const length = lengthOverride || (captchaFails >= 3 ? 6 : 5);
    const { text, image } = generateCaptcha(length);
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
    const target = tasks.find((t) => t.id === id);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) return;
    setTasks(tasks.filter(t => t.id !== id));
    if (target) {
      setUndoData([target]);
      setToast({ message: '已删除 1 条任务', action: '撤销' });
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setUndoData(null);
        setToast(null);
      }, 6000);
    }
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
    const deleted = tasks.filter((t) => selectedIds.has(t.id));
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids)
      .eq('user_id', session.user.id);
    if (error) return;
    setTasks(tasks.filter(t => !selectedIds.has(t.id)));
    clearSelection();
    if (deleted.length) {
      setUndoData(deleted);
      setToast({ message: `已删除 ${deleted.length} 条任务`, action: '撤销' });
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setUndoData(null);
        setToast(null);
      }, 6000);
    }
  };

  const undoDelete = async () => {
    if (!undoData || !session?.user?.id) return;
    const payload = undoData.map((t) => ({
      id: t.id,
      user_id: session.user.id,
      text: t.text,
      note: t.note,
      due_date: t.dueDate || null,
      priority: t.priority,
      category: t.category,
      tags: t.tags || [],
      order_index: t.orderIndex ?? 0,
      completed: t.completed,
      created_at: t.createdAt
    }));
    const { error } = await supabase.from('tasks').insert(payload);
    if (!error) {
      setTasks((prev) => [...undoData, ...prev]);
      setToast({ message: '已撤销删除' });
    } else {
      setToast({ message: '撤销失败' });
    }
    setUndoData(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setToast(null), 2000);
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
      const next = captchaFails + 1;
      setCaptchaFails(next);
      if (next >= 5) {
        setCaptchaLockUntil(Date.now() + 60 * 1000);
      }
      refreshCaptcha(next >= 3 ? 6 : 5);
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
      <AuthPanel
        recoveryMode={recoveryMode}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        updatePassword={updatePassword}
        authError={authError}
        authMode={authMode}
        setAuthMode={setAuthMode}
        setAuthError={setAuthError}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        handleAuth={handleAuth}
        sendResetEmail={sendResetEmail}
        captchaInput={captchaInput}
        setCaptchaInput={setCaptchaInput}
        captchaImage={captchaImage}
        captchaText={captchaText}
        refreshCaptcha={refreshCaptcha}
        captchaFails={captchaFails}
        captchaLockUntil={captchaLockUntil}
      />
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

        <EmailVerifyBanner show={!session.user.email_confirmed_at} />

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

            <TaskForm
              addTask={addTask}
              input={input}
              setInput={setInput}
              note={note}
              setNote={setNote}
              dueDate={dueDate}
              setDueDate={setDueDate}
              priority={priority}
              setPriority={setPriority}
              priorities={priorities}
              category={category}
              setCategory={setCategory}
              categories={categories}
              isManagingCats={isManagingCats}
              setIsManagingCats={setIsManagingCats}
              newCatInput={newCatInput}
              setNewCatInput={setNewCatInput}
              addCategory={addCategory}
              removeCategory={removeCategory}
              tags={tags}
              setTags={setTags}
              tagInput={tagInput}
              setTagInput={setTagInput}
            />

            <FiltersBar
              filter={filter}
              setFilter={setFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectAllFiltered={selectAllFiltered}
              clearSelection={clearSelection}
              bulkComplete={bulkComplete}
              bulkDelete={bulkDelete}
              canDrag={canDrag}
            />

            <TaskList
              filteredTasks={filteredTasks}
              toggleSelect={toggleSelect}
              selectedIds={selectedIds}
              toggleTask={toggleTask}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              priorities={priorities}
              isOverdue={isOverdue}
              deleteTask={deleteTask}
              canDrag={canDrag}
              handleDragStart={handleDragStart}
              handleDrop={handleDrop}
            />
          </>
        ) : (
          <Suspense fallback={<div className="text-sm text-[#7b6f8c]">加载统计中...</div>}>
            <StatsView stats={stats} />
          </Suspense>
        )}

        <SettingsModal
          show={showSettings}
          onClose={() => setShowSettings(false)}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          updatePassword={updatePassword}
          exportData={exportData}
          clearAllData={clearAllData}
          openPrivacy={() => {
            setShowPrivacy(true);
            setShowSettings(false);
          }}
        />

        <PrivacyModal show={showPrivacy} onClose={() => setShowPrivacy(false)} />

        <Toast toast={toast} onAction={undoDelete} />

        <div className="mt-16 text-center">
          <p className="text-[#ff9ccc] text-[10px] font-black uppercase tracking-[0.3em]">Soft Focus · Sweet Progress</p>
        </div>

      </div>
    </div>
  );
};

export default App;
