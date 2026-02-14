import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import {
  LayoutGrid,
  Cloud,
  PieChart,
  Dice5
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { generateCaptcha } from './utils/captcha.js';
import { useAuth } from './hooks/useAuth.js';
import { useTasks } from './hooks/useTasks.js';
import { useWheel } from './hooks/useWheel.js';
import { useTaskBoard } from './hooks/useTaskBoard.js';
import { useTaskMutations } from './hooks/useTaskMutations.js';
import { useAppPersistence } from './hooks/useAppPersistence.js';
import AuthPanel from './components/AuthPanel.jsx';
import Toast from './components/Toast.jsx';
import TaskForm from './components/TaskForm.jsx';
import FiltersBar from './components/FiltersBar.jsx';
import TaskList from './components/TaskList.jsx';
import { Sentry } from './sentry.js';
import { isOverdueDate } from './utils/date.js';

const StatsView = React.lazy(() => import('./StatsView.jsx'));
const prefetchStatsView = () => import('./StatsView.jsx');
const WheelPanel = React.lazy(() => import('./components/WheelPanel.jsx'));
const prefetchWheelPanel = () => import('./components/WheelPanel.jsx');
const SettingsModal = React.lazy(() => import('./components/SettingsModal.jsx'));
const PrivacyModal = React.lazy(() => import('./components/PrivacyModal.jsx'));
const EmailVerifyBanner = React.lazy(() => import('./components/EmailVerifyBanner.jsx'));
const CAPTCHA_LOCK_KEY = 'cloud_todo_captcha_lock_until';
const CAPTCHA_FAILS_KEY = 'cloud_todo_captcha_fails';

const App = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaFails, setCaptchaFails] = useState(0);
  const [captchaLockUntil, setCaptchaLockUntil] = useState(0);
  const [toast, setToast] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const toastTimerRef = useRef(null);
  const loadMoreAnchorRef = useRef(null);
  const lastAutoLoadAtRef = useRef(0);
  const taskInputRef = useRef(null);

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
  const [visibleCount, setVisibleCount] = useState(30);
  const [view, setView] = useState('tasks');
  const [expandedId, setExpandedId] = useState(null);
  const [isManagingCats, setIsManagingCats] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [addTaskLoading, setAddTaskLoading] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(true);
  const [activeSectionsCollapsed, setActiveSectionsCollapsed] = useState({});
  const [taskDensity, setTaskDensity] = useState('cozy');
  const [showBackTop, setShowBackTop] = useState(false);

  const enqueueToast = (payload, duration = 1500) => {
    const normalized = typeof payload === 'string' ? { message: payload } : payload;
    setToastQueue((prev) => [...prev, { ...normalized, duration, id: `${Date.now()}-${Math.random()}` }]);
  };

  const {
    session,
    authLoading,
    authError,
    setAuthError,
    authMode,
    setAuthMode,
    recoveryMode,
    handleAuth: authHandleAuth,
    signOut,
    sendResetEmail: authSendResetEmail,
    updatePassword: authUpdatePassword
  } = useAuth();

  const {
    tasks,
    setTasks,
    categories,
    setCategories,
    addTask: createTask,
    addCategory: createCategory,
    removeCategory,
    toggleTask,
    deleteTask: removeTask,
    updateTask: patchTask,
    bulkComplete: bulkCompleteTasks,
    bulkDelete: bulkDeleteTasks,
    saveOrder,
    restoreTasks,
    exportData: exportDataPayload,
    clearAllData: clearAllDataCore,
    stats,
    tasksLoading
  } = useTasks({ session, category, setCategory, setAuthError });

  const {
    wheelLoading,
    wheelGroups,
    wheelGroup,
    setWheelGroup,
    wheelSpinning,
    wheelAngle,
    wheelResult,
    wheelCreated,
    wheelCreating,
    currentWheelOptions,
    currentWheelHistory,
    addWheelOption,
    removeWheelOption,
    addWheelGroup,
    renameWheelGroup,
    deleteWheelGroup,
    clearWheelHistory,
    restoreWheelHistory,
    spinWheel,
    createTaskFromWheel,
    clearWheelData
  } = useWheel({ session, createTask, priority, category, dueDate, note, tags });

  const {
    filteredTasks,
    selectedIds,
    canDrag,
    toggleSelect,
    clearSelection,
    selectAllFiltered,
    handleDragStart,
    handleDrop,
    resetBoardState
  } = useTaskBoard({
    tasks,
    setTasks,
    filter,
    searchQuery,
    sortBy,
    saveOrder,
    onOrderSaved: () => {
      enqueueToast({ message: '排序已保存' }, 1400);
    }
  });

  const {
    bulkActionLoading,
    deleteTask,
    editTask,
    bulkComplete,
    bulkDelete,
    clearCompleted,
    undoDelete
  } = useTaskMutations({
    tasks,
    setTasks,
    selectedIds,
    clearSelection,
    removeTask,
    patchTask,
    bulkCompleteTasks,
    bulkDeleteTasks,
    restoreTasks,
    enqueueToast,
    setToast
  });

  useAppPersistence({
    session,
    categories,
    setCategory,
    setInput,
    setNote,
    setDueDate,
    setPriority,
    setTags,
    enqueueToast,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    view,
    setView,
    category,
    completedCollapsed,
    setCompletedCollapsed,
    activeSectionsCollapsed,
    setActiveSectionsCollapsed,
    taskDensity,
    setTaskDensity,
    input,
    note,
    dueDate,
    priority,
    tags
  });

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((v) => v.trim()).filter(Boolean);
  const isAdmin = session?.user?.email && adminEmails.includes(session.user.email);

  useEffect(() => {
    document.title = '云朵清单';
  }, []);

  useEffect(() => {
    const { text, image } = generateCaptcha(5);
    setCaptchaText(text);
    setCaptchaImage(image);
  }, []);

  useEffect(() => {
    try {
      const lockRaw = localStorage.getItem(CAPTCHA_LOCK_KEY);
      const failsRaw = localStorage.getItem(CAPTCHA_FAILS_KEY);
      const lockUntil = Number(lockRaw || 0);
      const fails = Number(failsRaw || 0);
      const now = Date.now();

      if (Number.isFinite(lockUntil) && lockUntil > now) {
        setCaptchaLockUntil(lockUntil);
      } else {
        localStorage.removeItem(CAPTCHA_LOCK_KEY);
      }

      if (Number.isFinite(fails) && fails > 0) {
        setCaptchaFails(Math.min(10, Math.max(0, Math.floor(fails))));
      } else {
        localStorage.removeItem(CAPTCHA_FAILS_KEY);
      }
    } catch {
      // Ignore localStorage failures.
    }
  }, []);

  useEffect(() => {
    try {
      if (captchaLockUntil > Date.now()) {
        localStorage.setItem(CAPTCHA_LOCK_KEY, String(captchaLockUntil));
      } else {
        localStorage.removeItem(CAPTCHA_LOCK_KEY);
      }

      if (captchaFails > 0) {
        localStorage.setItem(CAPTCHA_FAILS_KEY, String(captchaFails));
      } else {
        localStorage.removeItem(CAPTCHA_FAILS_KEY);
      }
    } catch {
      // Ignore localStorage failures.
    }
  }, [captchaLockUntil, captchaFails]);

  useEffect(() => {
    if (captchaLockUntil <= Date.now()) return;
    const timer = setTimeout(() => {
      setCaptchaLockUntil(0);
    }, Math.max(0, captchaLockUntil - Date.now() + 10));
    return () => clearTimeout(timer);
  }, [captchaLockUntil]);

  const refreshCaptcha = (lengthOverride) => {
    const length = typeof lengthOverride === 'number' ? lengthOverride : (captchaFails >= 3 ? 6 : 5);
    const { text, image } = generateCaptcha(length);
    setCaptchaText(text);
    setCaptchaImage(image);
    setCaptchaInput('');
  };

  useEffect(() => {
    if (session?.user?.id) return;
    setTasks([]);
    setCategories([]);
    setCategory('');
    setExpandedId(null);
    setActiveSectionsCollapsed({});
    resetBoardState();
  }, [session, setTasks, setCategories, resetBoardState]);

  useEffect(() => {
    if (view !== 'tasks') return;
    const timer = setTimeout(() => {
      void prefetchStatsView();
    }, 800);
    return () => clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    if (view !== 'tasks') return;
    const run = () => {
      void prefetchWheelPanel();
    };
    const idle = window.requestIdleCallback?.(run, { timeout: 1500 });
    if (idle) {
      return () => window.cancelIdleCallback?.(idle);
    }
    const timer = setTimeout(run, 900);
    return () => clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    setVisibleCount(30);
  }, [filter, searchQuery, sortBy, view]);

  useEffect(() => {
    if (!session?.user?.id || view !== 'tasks') return;
    const timer = setTimeout(() => taskInputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [session, view]);

  useEffect(() => {
    const onScroll = () => {
      setShowBackTop(window.scrollY > 520);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (toast || toastQueue.length === 0) return;
    setToast(toastQueue[0]);
    setToastQueue((prev) => prev.slice(1));
  }, [toast, toastQueue]);

  useEffect(() => {
    if (!toast || toast.action) return;
    const duration = Number.isFinite(toast.duration) ? toast.duration : 1500;
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, duration);
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [toast]);

  const priorities = {
    high: { label: '重要且紧急', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
    medium: { label: '重要不紧急', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    low: { label: '不重要但紧急', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    none: { label: '不重要不紧急', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100' }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (addTaskLoading) return;
    const trimmedText = input.trim();
    if (!trimmedText) return;

    const duplicate = tasks.some((t) => {
      if (t.completed) return false;
      return String(t.text || '').trim().toLowerCase() === trimmedText.toLowerCase()
        && String(t.category || '') === String(category || '');
    });
    if (duplicate) {
      enqueueToast({ message: '已存在相同任务（同分类）' }, 1500);
      taskInputRef.current?.focus();
      return;
    }

    setAddTaskLoading(true);
    try {
      const created = await createTask({ input, note, dueDate, priority, category, tags });
      if (created) {
        setInput('');
        setNote('');
        setDueDate('');
        setTags([]);
        setTagInput('');
        setTimeout(() => taskInputRef.current?.focus(), 0);
      }
    } finally {
      setAddTaskLoading(false);
    }
  };

  const hasTaskDraft = Boolean(
    input.trim() || note.trim() || dueDate || (tags && tags.length > 0) || category
  );

  const clearTaskDraft = () => {
    const userId = session?.user?.id;
    if (userId) {
      try {
        localStorage.removeItem(`cloud_todo_draft:${userId}`);
      } catch {
        // Ignore localStorage failures.
      }
    }
    setInput('');
    setNote('');
    setDueDate('');
    setPriority('medium');
    setTags([]);
    setTagInput('');
    setCategory(categories[0] || '');
    enqueueToast({ message: '草稿已清空' }, 1200);
    setTimeout(() => taskInputRef.current?.focus(), 0);
  };

  const addCategory = async () => {
    const created = await createCategory(newCatInput);
    if (created) {
      setNewCatInput('');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (captchaLockUntil > Date.now()) {
      setAuthError('验证码错误次数过多，请稍后再试');
      return;
    }

    const captchaOk = captchaInput.trim().toUpperCase() === captchaText;
    const onCaptchaFail = () => {
      const next = captchaFails + 1;
      setCaptchaFails(next);
      if (next >= 5) {
        setCaptchaLockUntil(Date.now() + 60 * 1000);
      }
      refreshCaptcha(next >= 3 ? 6 : 5);
    };

    if (captchaOk) {
      setCaptchaFails(0);
      if (captchaLockUntil <= Date.now()) {
        setCaptchaLockUntil(0);
      }
    }

    await authHandleAuth({
      email,
      password,
      captchaOk,
      onCaptchaFail,
      onCaptchaUsed: captchaOk ? () => refreshCaptcha() : undefined
    });
  };

  const sendResetEmail = async () => {
    await authSendResetEmail(email);
  };

  const updatePassword = async () => {
    const ok = await authUpdatePassword(newPassword);
    if (ok) {
      setNewPassword('');
    }
  };

  const exportData = async () => {
    const payload = await exportDataPayload();
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
  };

  const clearAllData = async () => {
    const [taskOk, wheelOk] = await Promise.all([clearAllDataCore(), clearWheelData()]);
    if (!taskOk || !wheelOk) return;
    resetBoardState();
  };

  const runWheelAction = async (action, failedMessage) => {
    const ok = await action();
    if (!ok) {
      enqueueToast({ message: failedMessage }, 1800);
    }
    return ok;
  };

  const resetTaskFilters = () => {
    setSearchQuery('');
    setSortBy('created_desc');
    setFilter('all');
  };

  const emptyMode = tasks.length > 0 && filteredTasks.length === 0 && (filter !== 'all' || searchQuery.trim())
    ? 'filtered'
    : 'all';
  const taskCounts = useMemo(() => {
    const all = tasks.length;
    const active = tasks.filter((t) => !t.completed).length;
    const completed = tasks.filter((t) => t.completed).length;
    const overdue = tasks.filter((t) => !t.completed && isOverdueDate(t.dueDate)).length;
    return { all, active, completed, overdue };
  }, [tasks]);

  const displayedTasks = useMemo(() => {
    if (canDrag) return filteredTasks;
    return filteredTasks.slice(0, visibleCount);
  }, [canDrag, filteredTasks, visibleCount]);

  const hasMoreTasks = !canDrag && filteredTasks.length > visibleCount;

  useEffect(() => {
    if (view !== 'tasks' || canDrag || !hasMoreTasks) return;
    const anchor = loadMoreAnchorRef.current;
    if (!anchor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        const now = Date.now();
        if (now - lastAutoLoadAtRef.current < 220) return;
        lastAutoLoadAtRef.current = now;

        setVisibleCount((prev) => Math.min(prev + 30, filteredTasks.length));
      },
      { root: null, rootMargin: '0px 0px 260px 0px', threshold: 0.05 }
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [view, canDrag, hasMoreTasks, filteredTasks.length]);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="card-soft-sm p-1 flex">
            <button onClick={() => setView('tasks')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'tasks' ? 'tab-active' : 'tab-inactive hover:text-[#ff6fb1]'}`}>
              <LayoutGrid className="w-4 h-4" /> 任务清单
            </button>
            <button onClick={() => setView('wheel')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'wheel' ? 'tab-active' : 'tab-inactive hover:text-[#ff6fb1]'}`}>
              <Dice5 className="w-4 h-4" /> 转盘
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

        <Suspense fallback={null}>
          <EmailVerifyBanner show={!session.user.email_confirmed_at} />
        </Suspense>

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
              taskInputRef={taskInputRef}
              taskSubmitting={addTaskLoading}
              hasTaskDraft={hasTaskDraft}
              clearTaskDraft={clearTaskDraft}
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

            <div className="sticky top-2 md:top-3 z-30 mb-6">
              <FiltersBar
                filter={filter}
                setFilter={setFilter}
                taskCounts={taskCounts}
                taskDensity={taskDensity}
                setTaskDensity={setTaskDensity}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                selectAllFiltered={selectAllFiltered}
                clearSelection={clearSelection}
                bulkComplete={bulkComplete}
                bulkDelete={bulkDelete}
                clearCompleted={clearCompleted}
                bulkActionLoading={bulkActionLoading}
                canDrag={canDrag}
                selectedCount={selectedIds.size}
                filteredCount={filteredTasks.length}
                filteredTasks={filteredTasks}
              />
            </div>

            {tasksLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="task-card-soft p-4">
                    <div className="skeleton-line h-3 w-28 mb-3" />
                    <div className="skeleton-line h-5 w-4/5 mb-2" />
                    <div className="skeleton-line h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <Sentry.ErrorBoundary fallback={<div className="surface-soft p-4 text-sm text-[#7b6f8c]">任务列表渲染异常，请刷新重试。</div>}>
                <TaskList
                  filteredTasks={displayedTasks}
                  emptyMode={emptyMode}
                  onResetFilters={resetTaskFilters}
                  onOpenWheel={() => setView('wheel')}
                  categories={categories}
                  searchQuery={searchQuery}
                  taskDensity={taskDensity}
                  groupCompleted={filter === 'all' && !searchQuery.trim()}
                  completedCollapsed={completedCollapsed}
                  setCompletedCollapsed={setCompletedCollapsed}
                  sectionCollapsedMap={activeSectionsCollapsed}
                  setSectionCollapsedMap={setActiveSectionsCollapsed}
                  toggleSelect={toggleSelect}
                  selectedIds={selectedIds}
                  toggleTask={toggleTask}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  priorities={priorities}
                  deleteTask={deleteTask}
                  editTask={editTask}
                  canDrag={canDrag}
                  handleDragStart={handleDragStart}
                  handleDrop={handleDrop}
                />
              </Sentry.ErrorBoundary>
            )}

            <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className="text-[11px] text-[#7b6f8c]">
                当前显示 {displayedTasks.length} / {filteredTasks.length} 条任务
              </p>
              {hasMoreTasks && (
                <span className="text-[11px] text-[#7b6f8c]">下滑到底部会自动加载更多</span>
              )}
            </div>
            {hasMoreTasks && (
              <div className="surface-soft mt-2 px-4 py-3 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 30, filteredTasks.length))}
                  className="pill-soft px-3 py-1 rounded-full text-[11px] font-bold"
                >
                  手动加载更多
                </button>
                <div
                  ref={loadMoreAnchorRef}
                  className="h-6 text-[11px] text-[#7b6f8c] flex items-center justify-center"
                >
                  也可继续下滑自动加载
                </div>
              </div>
            )}
          </>
        ) : view === 'wheel' ? (
          <>
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="lg:col-span-2 flex flex-col justify-end">
                <h1 className="text-3xl font-bold tracking-tight text-[#3b2e4a] flex items-center gap-2">
                  <Dice5 className="w-7 h-7 text-[#ff8acb]" /> 决策转盘
                </h1>
                <p className="text-[#7b6f8c] mt-1">把犹豫交给转盘，先开始再优化。</p>
              </div>
            </div>

            <Sentry.ErrorBoundary fallback={<div className="surface-soft p-4 text-sm text-[#7b6f8c]">转盘区域出错了，请刷新重试。</div>}>
              <Suspense fallback={<div className="surface-soft p-4 text-sm text-[#7b6f8c]">转盘加载中...</div>}>
                <WheelPanel
                  loading={wheelLoading}
                  groups={wheelGroups}
                  currentGroup={wheelGroup}
                  onGroupChange={setWheelGroup}
                  onAddGroup={(name) => runWheelAction(() => addWheelGroup(name), '新建分组失败')}
                  onRenameGroup={(from, to) => runWheelAction(() => renameWheelGroup(from, to), '重命名分组失败')}
                  onDeleteGroup={(name) => runWheelAction(() => deleteWheelGroup(name), '删除分组失败')}
                  onClearHistory={() => runWheelAction(() => clearWheelHistory(), '清空记录失败')}
                  onRestoreHistory={(items) => runWheelAction(() => restoreWheelHistory(items), '撤销清空失败')}
                  options={currentWheelOptions}
                  history={currentWheelHistory}
                  spinning={wheelSpinning}
                  angle={wheelAngle}
                  result={wheelResult}
                  created={wheelCreated}
                  creating={wheelCreating}
                  onSpin={spinWheel}
                  onAddOption={(label) => runWheelAction(() => addWheelOption(label), '添加选项失败')}
                  onRemoveOption={(id) => runWheelAction(() => removeWheelOption(id), '删除选项失败')}
                  onCreateTask={createTaskFromWheel}
                  onOpenTasks={() => setView('tasks')}
                />
              </Suspense>
            </Sentry.ErrorBoundary>
          </>
        ) : (
          <Sentry.ErrorBoundary fallback={<div className="surface-soft p-4 text-sm text-[#7b6f8c]">统计区域出错了，请稍后重试。</div>}>
            <Suspense fallback={<div className="text-sm text-[#7b6f8c]">加载统计中...</div>}>
              <StatsView stats={stats} />
            </Suspense>
          </Sentry.ErrorBoundary>
        )}

        <Suspense fallback={null}>
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
        </Suspense>

        <Toast toast={toast} onAction={undoDelete} />

        <div className="mt-16 text-center">
          <p className="text-[#ff9ccc] text-[10px] font-black uppercase tracking-[0.3em]">Soft Focus · Sweet Progress</p>
        </div>

        {showBackTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed safe-bottom-floating right-5 md:right-8 z-40 pill-soft px-3 py-2 rounded-full text-[11px] font-black shadow-[0_10px_24px_rgba(255,138,203,0.3)]"
            aria-label="回到顶部"
          >
            回到顶部
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
