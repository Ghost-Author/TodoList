import { useEffect, useRef, useState } from 'react';

export const useTaskMutations = ({
  tasks,
  setTasks,
  selectedIds,
  clearSelection,
  removeTask,
  patchTask,
  bulkCompleteTasks,
  bulkDeleteTasks,
  bulkUpdateTasks,
  restoreTasks,
  enqueueToast,
  setToast
}) => {
  const [undoData, setUndoData] = useState(null);
  const [bulkActionLoading, setBulkActionLoading] = useState('');
  const undoTimerRef = useRef(null);

  useEffect(() => () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const scheduleUndo = (items, message) => {
    setUndoData(items);
    setToast({ message, action: '撤销' });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setUndoData(null);
      setToast(null);
    }, 6000);
  };

  const deleteTask = async (id) => {
    const target = await removeTask(id);
    if (!target) return;
    scheduleUndo([target], '已删除 1 条任务');
  };

  const editTask = async (id, payload) => {
    const updated = await patchTask(id, payload);
    if (!updated) {
      enqueueToast({ message: '保存失败，请重试' }, 1500);
      return false;
    }
    enqueueToast({ message: '任务已更新' }, 1200);
    return true;
  };

  const bulkComplete = async (completed) => {
    if (selectedIds.size === 0 || bulkActionLoading) return;
    const ids = Array.from(selectedIds);
    const idSet = new Set(ids);
    const snapshot = tasks
      .filter((t) => idSet.has(t.id))
      .map((t) => ({ id: t.id, completed: t.completed }));
    setBulkActionLoading(completed ? 'complete' : 'uncomplete');
    try {
      setTasks((prev) => prev.map((t) => (idSet.has(t.id) ? { ...t, completed } : t)));
      const ok = await bulkCompleteTasks(ids, completed);
      if (ok) {
        clearSelection();
        enqueueToast({ message: completed ? `已标记 ${ids.length} 条为完成` : `已标记 ${ids.length} 条为未完成` }, 1300);
      } else {
        const revertMap = new Map(snapshot.map((item) => [item.id, item.completed]));
        setTasks((prev) => prev.map((t) => (
          revertMap.has(t.id) ? { ...t, completed: revertMap.get(t.id) } : t
        )));
        enqueueToast({ message: '操作失败，已回滚' }, 1500);
      }
    } finally {
      setBulkActionLoading('');
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0 || bulkActionLoading) return;
    const ids = Array.from(selectedIds);
    const idSet = new Set(ids);
    const snapshot = tasks.filter((t) => idSet.has(t.id));
    setBulkActionLoading('delete');
    try {
      setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
      clearSelection();
      const deleted = await bulkDeleteTasks(ids);
      if (!deleted) {
        setTasks((prev) => [...snapshot, ...prev]);
        enqueueToast({ message: '删除失败，已回滚' }, 1500);
        return;
      }
      if (snapshot.length === 0) return;
      scheduleUndo(snapshot, `已删除 ${snapshot.length} 条任务`);
    } finally {
      setBulkActionLoading('');
    }
  };

  const clearCompleted = async () => {
    if (bulkActionLoading) return;
    const ids = tasks.filter((t) => t.completed).map((t) => t.id);
    const idSet = new Set(ids);
    const snapshot = tasks.filter((t) => idSet.has(t.id));
    if (ids.length === 0) return;
    setBulkActionLoading('clearCompleted');
    try {
      setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
      const deleted = await bulkDeleteTasks(ids);
      if (!deleted) {
        setTasks((prev) => [...snapshot, ...prev]);
        enqueueToast({ message: '清理失败，已回滚' }, 1500);
        return;
      }
      if (snapshot.length === 0) return;
      clearSelection();
      scheduleUndo(snapshot, `已清理 ${snapshot.length} 条已完成任务`);
    } finally {
      setBulkActionLoading('');
    }
  };

  const bulkSetFields = async (payload) => {
    if (selectedIds.size === 0 || bulkActionLoading) return false;
    const ids = Array.from(selectedIds);
    const idSet = new Set(ids);
    const snapshot = tasks.filter((t) => idSet.has(t.id)).map((t) => ({
      id: t.id,
      priority: t.priority,
      category: t.category,
      dueDate: t.dueDate
    }));
    setBulkActionLoading('updateFields');
    try {
      setTasks((prev) => prev.map((t) => {
        if (!idSet.has(t.id)) return t;
        return {
          ...t,
          ...(Object.prototype.hasOwnProperty.call(payload || {}, 'priority') ? { priority: payload.priority || 'medium' } : {}),
          ...(Object.prototype.hasOwnProperty.call(payload || {}, 'category') ? { category: payload.category || '' } : {}),
          ...(Object.prototype.hasOwnProperty.call(payload || {}, 'dueDate') ? { dueDate: payload.dueDate || '' } : {})
        };
      }));
      const ok = await bulkUpdateTasks(ids, payload);
      if (!ok) {
        const map = new Map(snapshot.map((item) => [item.id, item]));
        setTasks((prev) => prev.map((t) => {
          const old = map.get(t.id);
          return old ? { ...t, priority: old.priority, category: old.category, dueDate: old.dueDate } : t;
        }));
        enqueueToast({ message: '批量设置失败，已回滚' }, 1500);
        return false;
      }
      clearSelection();
      enqueueToast({ message: `已批量更新 ${ids.length} 条任务` }, 1300);
      return true;
    } finally {
      setBulkActionLoading('');
    }
  };

  const undoDelete = async () => {
    if (!undoData) return;
    const ok = await restoreTasks(undoData);
    if (ok) {
      enqueueToast({ message: '已撤销删除' }, 1600);
    } else {
      enqueueToast({ message: '撤销失败' }, 1600);
    }
    setUndoData(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setToast(null);
  };

  return {
    bulkActionLoading,
    deleteTask,
    editTask,
    bulkComplete,
    bulkDelete,
    clearCompleted,
    bulkSetFields,
    undoDelete
  };
};
