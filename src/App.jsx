import React, { useState, useEffect, useMemo, useDeferredValue, Suspense, useRef, useCallback } from 'react';
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
import { useAuth } from './hooks/useAuth.js';
import { useTasks } from './hooks/useTasks.js';
const StatsView = React.lazy(() => import('./StatsView.jsx'));

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(v => v.trim()).filter(Boolean);

const App = () => {
  // --- State Management ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
  const deferredQuery = useDeferredValue(searchQuery);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [view, setView] = useState('tasks');
  const [expandedId, setExpandedId] = useState(null);
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  
  const auth = useAuth();
  const { session, authLoading, authError, authMode, setAuthMode, recoveryMode, handleAuth: handleAuthApi, signOut, sendResetEmail, updatePassword, setAuthError } = auth;

  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    document.title = '云朵清单';
  }, []);

  useEffect(() => {
    const { text, image } = generateCaptcha(5);
    setCaptchaText(text);
    setCaptchaImage(image);
  }, []);

  const refreshCaptcha = (lengthOverride) => {
    const length = typeof lengthOverride === 'number' ? lengthOverride : (captchaFails >= 3 ? 6 : 5);
    const { text, image } = generateCaptcha(length);
    setCaptchaText(text);
    setCaptchaImage(image);
    setCaptchaInput('');
  };

  const tasksApi = useTasks({ session, category, setCategory, setAuthError });
  const { tasks, categories, stats, setTasks, setCategories } = tasksApi;

  useEffect(() => {
    if (!session) {
      setTasks([]);
      setCategories([]);
      setCategory('');
    }
  }, [session, setTasks, setCategories]);

  // --- Task & Category Logic ---
  const priorities = useMemo(() => ({
    high: { label: '重要且紧急', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
    medium: { label: '重要不紧急', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    low: { label: '不重要但紧急', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    none: { label: '不重要不紧急', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100' }
  }), []);

  const addTask = useCallback(async (e) => {
    e.preventDefault();
    const created = await tasksApi.addTask({
      input,
      note,
      dueDate,
      priority,
      category,
      tags
    });
    if (!created) return;
    setInput('');
    setNote('');
    setDueDate('');
    setTags([]);
    setTagInput('');
  }, [tasksApi, input, note, dueDate, priority, category, tags]);

  const addCategory = useCallback(async () => {
    const created = await tasksApi.addCategory(newCatInput);
    if (!created) return;
    setNewCatInput('');
  }, [tasksApi, newCatInput]);

  const removeCategory = useCallback(async (cat) => {
    await tasksApi.removeCategory(cat);
  }, [tasksApi]);

  const toggleTask = useCallback(async (id) => {
    await tasksApi.toggleTask(id);
  }, [tasksApi]);

  const deleteTask = useCallback(async (id) => {
    const target = await tasksApi.deleteTask(id);
    if (target) {
      setUndoData([target]);
      setToast({ message: '已删除 1 条任务', action: '撤销' });
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setUndoData(null);
        setToast(null);
      }, 6000);
    }
  }, [tasksApi]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);


  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
  }, [filteredTasks]);

  const bulkComplete = useCallback(async (completed) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const ok = await tasksApi.bulkComplete(ids, completed);
    if (!ok) return;
    clearSelection();
  }, [tasksApi, selectedIds, clearSelection]);

  const bulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const deleted = await tasksApi.bulkDelete(ids);
    if (!deleted) return;
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
  }, [tasksApi, selectedIds, clearSelection]);

  const undoDelete = useCallback(async () => {
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
  }, [undoData, session, setTasks]);

  const canDrag = filter === 'all' && !searchQuery.trim() && sortBy === 'manual';

  const handleDragStart = useCallback((id) => {
    if (!canDrag) return;
    setDragId(id);
  }, [canDrag]);

  const handleDrop = useCallback(async (targetId) => {
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
    const ok = await tasksApi.saveOrder(updated);
    if (ok) {
      setToast({ message: '排序已保存' });
      setTimeout(() => setToast(null), 1500);
    }
  }, [canDrag, dragId, tasks, setTasks, tasksApi]);

  const handleAuth = useCallback(async (e) => {
    e.preventDefault();
    if (captchaLockUntil > Date.now()) {
      setAuthError('验证码错误次数过多，请稍后再试');
      return;
    }
    const captchaOk = captchaInput.trim().toUpperCase() === captchaText;
    await handleAuthApi({
      email,
      password,
      captchaOk,
      onCaptchaFail: () => {
        const next = captchaFails + 1;
        setCaptchaFails(next);
        if (next >= 5) {
          setCaptchaLockUntil(Date.now() + 60 * 1000);
        }
        refreshCaptcha(next >= 3 ? 6 : 5);
      },
      onCaptchaUsed: () => {
        if (captchaOk) {
          setCaptchaFails(0);
          refreshCaptcha();
        }
      }
    });
  }, [captchaLockUntil, captchaInput, captchaText, handleAuthApi, email, password, captchaFails, refreshCaptcha, setAuthError]);

  const handleSendResetEmail = useCallback(async () => {
    await sendResetEmail(email);
  }, [sendResetEmail, email]);

  const handleUpdatePassword = useCallback(async () => {
    const ok = await updatePassword(newPassword);
    if (ok) setNewPassword('');
  }, [updatePassword, newPassword]);

  const exportData = useCallback(async () => {
    const payload = await tasksApi.exportData();
    if (!payload) return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloud-todo-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [tasksApi]);

  const clearAllData = useCallback(async () => {
    await tasksApi.clearAllData();
  }, [tasksApi]);

  const isOverdue = useCallback((date) => {
    if (!date) return false;
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  }, []);

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
        updatePassword={handleUpdatePassword}
        authError={authError}
        authMode={authMode}
        setAuthMode={setAuthMode}
        setAuthError={setAuthError}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        handleAuth={handleAuth}
        sendResetEmail={handleSendResetEmail}
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
          updatePassword={handleUpdatePassword}
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
