import { useEffect, useRef } from 'react';

export const useAppPersistence = ({
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
}) => {
  const draftLoadedUserRef = useRef('');
  const prefsLoadedUserRef = useRef('');
  const preferredCategoryRef = useRef('');

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      draftLoadedUserRef.current = '';
      prefsLoadedUserRef.current = '';
      preferredCategoryRef.current = '';
      return;
    }
    if (draftLoadedUserRef.current === userId) return;
    draftLoadedUserRef.current = userId;

    try {
      const raw = localStorage.getItem(`cloud_todo_draft:${userId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.input === 'string') setInput(parsed.input);
      if (typeof parsed.note === 'string') setNote(parsed.note);
      if (typeof parsed.dueDate === 'string') setDueDate(parsed.dueDate);
      if (typeof parsed.priority === 'string') setPriority(parsed.priority);
      if (Array.isArray(parsed.tags)) setTags(parsed.tags.map((v) => String(v)).slice(0, 20));
      if (typeof parsed.category === 'string') setCategory(parsed.category);
      enqueueToast({ message: '已恢复上次草稿' }, 1400);
    } catch {
      localStorage.removeItem(`cloud_todo_draft:${userId}`);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    if (prefsLoadedUserRef.current === userId) return;
    prefsLoadedUserRef.current = userId;

    try {
      const raw = localStorage.getItem(`cloud_todo_prefs:${userId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.filter === 'all' || parsed.filter === 'active' || parsed.filter === 'completed' || parsed.filter === 'overdue') {
        setFilter(parsed.filter);
      }
      if (typeof parsed.sortBy === 'string') {
        setSortBy(parsed.sortBy);
      }
      if (parsed.view === 'tasks' || parsed.view === 'wheel' || parsed.view === 'stats') {
        setView(parsed.view);
      }
      if (typeof parsed.completedCollapsed === 'boolean') {
        setCompletedCollapsed(parsed.completedCollapsed);
      }
      if (parsed.activeSectionsCollapsed && typeof parsed.activeSectionsCollapsed === 'object') {
        setActiveSectionsCollapsed(parsed.activeSectionsCollapsed);
      }
      if (parsed.taskDensity === 'cozy' || parsed.taskDensity === 'compact') {
        setTaskDensity(parsed.taskDensity);
      }
      if (typeof parsed.category === 'string' && parsed.category.trim()) {
        preferredCategoryRef.current = parsed.category.trim();
      }
    } catch {
      localStorage.removeItem(`cloud_todo_prefs:${userId}`);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const preferred = preferredCategoryRef.current;
    if (!preferred || categories.length === 0) return;
    if (categories.includes(preferred)) {
      setCategory(preferred);
    }
    preferredCategoryRef.current = '';
  }, [categories]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    const key = `cloud_todo_draft:${userId}`;
    const hasDraft = Boolean(
      input.trim() || note.trim() || dueDate || (tags && tags.length > 0) || category
    );
    try {
      if (!hasDraft) {
        localStorage.removeItem(key);
        return;
      }
      const payload = {
        input,
        note,
        dueDate,
        priority,
        tags,
        category
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore localStorage failures (private mode / quota exceeded).
    }
  }, [session?.user?.id, input, note, dueDate, priority, tags, category]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    if (prefsLoadedUserRef.current !== userId) return;
    try {
      localStorage.setItem(
        `cloud_todo_prefs:${userId}`,
        JSON.stringify({
          filter,
          sortBy,
          view,
          category,
          completedCollapsed,
          activeSectionsCollapsed,
          taskDensity
        })
      );
    } catch {
      // Ignore localStorage failures.
    }
  }, [session?.user?.id, filter, sortBy, view, category, completedCollapsed, activeSectionsCollapsed, taskDensity]);
};

