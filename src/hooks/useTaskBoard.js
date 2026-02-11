import { useCallback, useDeferredValue, useMemo, useState } from 'react';

export const useTaskBoard = ({
  tasks,
  setTasks,
  filter,
  searchQuery,
  sortBy,
  saveOrder,
  onOrderSaved
}) => {
  const deferredQuery = useDeferredValue(searchQuery);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dragId, setDragId] = useState(null);
  const [lastSelectedId, setLastSelectedId] = useState(null);

  const isOverdueDate = (value) => {
    if (!value) return false;
    const due = new Date(value);
    if (Number.isNaN(due.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filter === 'active') result = tasks.filter((t) => !t.completed);
    if (filter === 'completed') result = tasks.filter((t) => t.completed);
    if (filter === 'overdue') result = tasks.filter((t) => !t.completed && isOverdueDate(t.dueDate));
    if (deferredQuery.trim()) {
      const q = deferredQuery.trim().toLowerCase();
      result = result.filter((t) => {
        const hay = [t.text, t.note, t.category, ...(t.tags || [])].join(' ').toLowerCase();
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

  const canDrag = filter === 'all' && !searchQuery.trim() && sortBy === 'manual';

  const toggleSelect = useCallback((id, opts = {}) => {
    const { shiftKey = false, orderedIds = [] } = opts;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (
        shiftKey
        && lastSelectedId
        && Array.isArray(orderedIds)
        && orderedIds.length > 1
      ) {
        const start = orderedIds.indexOf(lastSelectedId);
        const end = orderedIds.indexOf(id);
        if (start >= 0 && end >= 0) {
          const [from, to] = start < end ? [start, end] : [end, start];
          orderedIds.slice(from, to + 1).forEach((taskId) => next.add(taskId));
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastSelectedId(id);
  }, [lastSelectedId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    setLastSelectedId(filteredTasks[0]?.id || null);
  }, [filteredTasks]);

  const handleDragStart = useCallback((id) => {
    if (!canDrag) return;
    setDragId(id);
  }, [canDrag]);

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

    const ok = await saveOrder(updated);
    if (ok && onOrderSaved) {
      onOrderSaved();
    }
  };

  const resetBoardState = useCallback(() => {
    setSelectedIds(new Set());
    setDragId(null);
    setLastSelectedId(null);
  }, []);

  return {
    filteredTasks,
    selectedIds,
    canDrag,
    toggleSelect,
    clearSelection,
    selectAllFiltered,
    handleDragStart,
    handleDrop,
    resetBoardState
  };
};
