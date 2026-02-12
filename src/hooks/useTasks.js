import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

const defaultCategories = ['工作', '生活', '学习', '健康', '其他'];

export const useTasks = ({ session, category, setCategory, setAuthError }) => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

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
    if (!session?.user?.id) {
      setTasksLoading(false);
      return;
    }
    const userId = session.user.id;
    setTasksLoading(true);
    Promise.all([ensureDefaultCategories(userId), loadTasks(userId)])
      .then(([cats]) => {
        if (!category && cats.length > 0) {
          setCategory(cats[0].name);
        }
      })
      .catch((err) => {
        if (setAuthError) setAuthError(err?.message || '加载失败');
      })
      .finally(() => {
        setTasksLoading(false);
      });
  }, [session]);

  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories, category, setCategory]);

  const addTask = async ({
    input,
    note,
    dueDate,
    priority,
    category,
    tags
  }) => {
    if (!input.trim() || !session?.user?.id) return null;
    const minOrder = tasks.length ? Math.min(...tasks.map((t) => t.orderIndex ?? 0)) : 0;
    const taskCategory = category || categories[0] || '';
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: session.user.id,
        text: input.trim(),
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
    if (error) return null;
    const newTask = {
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
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const addCategory = async (name) => {
    if (!name.trim() || categories.includes(name.trim()) || !session?.user?.id) return null;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: name.trim(), user_id: session.user.id })
      .select('name')
      .single();
    if (error) return null;
    setCategories((prev) => [...prev, data.name]);
    return data.name;
  };

  const removeCategory = async (cat) => {
    if (categories.length <= 1 || !session?.user?.id) return false;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', session.user.id)
      .eq('name', cat);
    if (error) return false;
    const next = categories.filter(c => c !== cat);
    setCategories(next);
    if (category === cat) setCategory(next[0] || '');
    return true;
  };

  const toggleTask = async (id) => {
    const target = tasks.find(t => t.id === id);
    if (!target || !session?.user?.id) return false;
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !target.completed })
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) return false;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    return true;
  };

  const deleteTask = async (id) => {
    if (!session?.user?.id) return null;
    const target = tasks.find((t) => t.id === id);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) return null;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    return target || null;
  };

  const updateTask = async (id, payload) => {
    if (!session?.user?.id || !id) return null;
    const text = String(payload?.input || '').trim();
    if (!text) return null;
    const nextTags = Array.isArray(payload?.tags) ? payload.tags.slice(0, 20) : [];

    const { data, error } = await supabase
      .from('tasks')
      .update({
        text,
        note: String(payload?.note || '').trim(),
        due_date: payload?.dueDate || null,
        priority: payload?.priority || 'medium',
        category: payload?.category || '',
        tags: nextTags
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select('id, text, note, due_date, priority, category, tags, order_index, completed, created_at')
      .single();

    if (error || !data) return null;

    const updated = {
      id: data.id,
      text: data.text,
      note: data.note || '',
      dueDate: data.due_date || '',
      priority: data.priority || 'medium',
      category: data.category || '',
      tags: data.tags || [],
      orderIndex: data.order_index ?? 0,
      completed: data.completed,
      createdAt: data.created_at
    };

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    return updated;
  };

  const bulkComplete = async (ids, completed) => {
    if (!session?.user?.id || ids.length === 0) return false;
    const { error } = await supabase
      .from('tasks')
      .update({ completed })
      .in('id', ids)
      .eq('user_id', session.user.id);
    if (error) return false;
    setTasks((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, completed } : t)));
    return true;
  };

  const bulkDelete = async (ids) => {
    if (!session?.user?.id || ids.length === 0) return null;
    const deleted = tasks.filter((t) => ids.includes(t.id));
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids)
      .eq('user_id', session.user.id);
    if (error) return null;
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    return deleted;
  };

  const saveOrder = async (updated) => {
    if (!session?.user?.id) return false;
    const { error } = await supabase
      .from('tasks')
      .upsert(updated.map((t) => ({ id: t.id, user_id: session.user.id, order_index: t.orderIndex })), { onConflict: 'id' });
    return !error;
  };

  const restoreTasks = async (deletedTasks) => {
    if (!session?.user?.id || !Array.isArray(deletedTasks) || deletedTasks.length === 0) return false;
    const payload = deletedTasks.map((t) => ({
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
    if (error) return false;
    setTasks((prev) => [...deletedTasks, ...prev]);
    return true;
  };

  const exportData = async () => {
    if (!session?.user?.id) return null;
    const userId = session.user.id;
    const [tasksRes, catsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').eq('user_id', userId)
    ]);
    if (tasksRes.error || catsRes.error) return null;
    return {
      exportedAt: new Date().toISOString(),
      tasks: tasksRes.data,
      categories: catsRes.data
    };
  };

  const clearAllData = async () => {
    if (!session?.user?.id) return false;
    const userId = session.user.id;
    const [tasksRes, catsRes] = await Promise.all([
      supabase.from('tasks').delete().eq('user_id', userId),
      supabase.from('categories').delete().eq('user_id', userId)
    ]);
    if (tasksRes.error || catsRes.error) return false;
    setTasks([]);
    const cats = await ensureDefaultCategories(userId);
    setCategory(cats[0]?.name || '');
    return true;
  };

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

  return {
    tasks,
    setTasks,
    categories,
    setCategories,
    addTask,
    addCategory,
    removeCategory,
    toggleTask,
    deleteTask,
    updateTask,
    bulkComplete,
    bulkDelete,
    saveOrder,
    restoreTasks,
    exportData,
    clearAllData,
    stats,
    tasksLoading
  };
};
