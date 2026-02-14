import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

const DEFAULT_GROUPS = ['随机', '工作', '生活'];
const DEFAULT_OPTIONS = ['整理桌面 5 分钟', '喝一杯水', '伸展一下', '列 3 个小目标', '处理一个小任务', '站起来走一走'];

export const useWheel = ({ session, createTask, priority, category, dueDate, note, tags }) => {
  const [wheelOptions, setWheelOptions] = useState([]);
  const [wheelHistory, setWheelHistory] = useState([]);
  const [wheelLoading, setWheelLoading] = useState(true);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelResult, setWheelResult] = useState('');
  const [wheelCreated, setWheelCreated] = useState(false);
  const [wheelCreating, setWheelCreating] = useState(false);
  const [wheelGroups, setWheelGroups] = useState(DEFAULT_GROUPS);
  const [wheelGroup, setWheelGroup] = useState('随机');
  const wheelAngleRef = useRef(0);
  const spinTimerRef = useRef(null);

  const resetWheelData = () => {
    setWheelOptions([]);
    setWheelHistory([]);
    setWheelLoading(false);
    setWheelSpinning(false);
    setWheelAngle(0);
    setWheelResult('');
    setWheelCreated(false);
    setWheelCreating(false);
    setWheelGroups(DEFAULT_GROUPS);
    setWheelGroup('随机');
    wheelAngleRef.current = 0;
    if (spinTimerRef.current) {
      clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }
  };

  const clearWheelData = async () => {
    if (!session?.user?.id) return false;
    const userId = session.user.id;

    const [optRes, histRes, groupRes] = await Promise.all([
      supabase.from('wheel_options').delete().eq('user_id', userId),
      supabase.from('wheel_history').delete().eq('user_id', userId),
      supabase.from('wheel_groups').delete().eq('user_id', userId)
    ]);

    if (optRes.error || histRes.error || groupRes.error) return false;

    resetWheelData();
    return true;
  };

  useEffect(() => {
    if (!session?.user?.id) {
      resetWheelData();
      return;
    }

    const userId = session.user.id;
    let mounted = true;
    const isAlive = () => mounted;
    setWheelLoading(true);

    const loadWheel = async () => {
      try {
        const [groupRes, optRes, histRes] = await Promise.all([
          supabase
            .from('wheel_groups')
            .select('id, name, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }),
          supabase
            .from('wheel_options')
            .select('id, label, group_name, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }),
          supabase
            .from('wheel_history')
            .select('id, label, group_name, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        if (!isAlive()) return;

        if (groupRes.data && groupRes.data.length > 0) {
          const names = groupRes.data.map((g) => g.name);
          if (!isAlive()) return;
          setWheelGroups(['随机', ...names.filter((n) => n !== '随机')]);
        } else {
          if (!isAlive()) return;
          setWheelGroups(DEFAULT_GROUPS);
        }

        if (optRes.data && optRes.data.length > 0) {
          if (!isAlive()) return;
          setWheelOptions(optRes.data);
        } else {
          const { data: seeded } = await supabase
            .from('wheel_options')
            .insert(DEFAULT_OPTIONS.map((label) => ({ user_id: userId, label, group_name: '随机' })))
            .select('id, label, group_name, created_at')
            .order('created_at', { ascending: true });
          if (seeded && isAlive()) setWheelOptions(seeded);
        }

        if (histRes.data) {
          if (!isAlive()) return;
          setWheelHistory(histRes.data);
        }
      } finally {
        if (isAlive()) setWheelLoading(false);
      }
    };

    void loadWheel();

    return () => {
      mounted = false;
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
        spinTimerRef.current = null;
      }
    };
  }, [session]);

  useEffect(() => {
    setWheelResult('');
    setWheelCreated(false);
    setWheelCreating(false);
  }, [wheelGroup]);

  const currentWheelOptions = useMemo(
    () => wheelOptions.filter((opt) => (opt.group_name || '随机') === wheelGroup),
    [wheelOptions, wheelGroup]
  );

  const currentWheelHistory = useMemo(
    () => wheelHistory.filter((h) => (h.group_name || '随机') === wheelGroup),
    [wheelHistory, wheelGroup]
  );

  const addWheelOption = async (label) => {
    if (!session?.user?.id) return false;
    const { data, error } = await supabase
      .from('wheel_options')
      .insert({ user_id: session.user.id, label, group_name: wheelGroup })
      .select('id, label, group_name, created_at')
      .single();
    if (error || !data) return false;
    setWheelOptions((prev) => [...prev, data]);
    return true;
  };

  const removeWheelOption = async (id) => {
    if (!session?.user?.id) return false;
    const { error } = await supabase
      .from('wheel_options')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) return false;
    setWheelOptions((prev) => prev.filter((opt) => opt.id !== id));
    return true;
  };

  const addWheelGroup = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === '随机') return false;
    if (wheelGroups.includes(trimmed)) return false;
    if (!session?.user?.id) return false;

    const { data, error } = await supabase
      .from('wheel_groups')
      .insert({ user_id: session.user.id, name: trimmed })
      .select('id, name, created_at')
      .single();
    if (error || !data) return false;

    setWheelGroups((prev) => [...prev, data.name]);
    setWheelGroup(data.name);
    return true;
  };

  const renameWheelGroup = async (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === '随机') return false;
    if (oldName === '随机') return false;
    if (wheelGroups.includes(trimmed) && trimmed !== oldName) return false;
    if (!session?.user?.id) return false;

    const { error: groupError } = await supabase
      .from('wheel_groups')
      .update({ name: trimmed })
      .eq('user_id', session.user.id)
      .eq('name', oldName);
    if (groupError) return false;

    const { error: optionError } = await supabase
      .from('wheel_options')
      .update({ group_name: trimmed })
      .eq('user_id', session.user.id)
      .eq('group_name', oldName);
    const { error: historyError } = await supabase
      .from('wheel_history')
      .update({ group_name: trimmed })
      .eq('user_id', session.user.id)
      .eq('group_name', oldName);

    if (optionError || historyError) {
      await supabase
        .from('wheel_groups')
        .update({ name: oldName })
        .eq('user_id', session.user.id)
        .eq('name', trimmed);
      return false;
    }

    setWheelGroups((prev) => prev.map((g) => (g === oldName ? trimmed : g)));
    if (wheelGroup === oldName) {
      setWheelGroup(trimmed);
    }
    return true;
  };

  const deleteWheelGroup = async (name) => {
    if (name === '随机') return false;
    if (!session?.user?.id) return false;

    const { error: optionError } = await supabase
      .from('wheel_options')
      .update({ group_name: '随机' })
      .eq('user_id', session.user.id)
      .eq('group_name', name);
    const { error: historyError } = await supabase
      .from('wheel_history')
      .update({ group_name: '随机' })
      .eq('user_id', session.user.id)
      .eq('group_name', name);
    if (optionError || historyError) return false;

    const { error: groupError } = await supabase
      .from('wheel_groups')
      .delete()
      .eq('user_id', session.user.id)
      .eq('name', name);
    if (groupError) return false;

    setWheelGroups((prev) => prev.filter((g) => g !== name));
    if (wheelGroup === name) {
      setWheelGroup('随机');
    }
    return true;
  };

  const clearWheelHistory = async () => {
    if (!session?.user?.id) return false;
    const { error } = await supabase
      .from('wheel_history')
      .delete()
      .eq('user_id', session.user.id)
      .eq('group_name', wheelGroup);
    if (error) return false;
    setWheelHistory((prev) => prev.filter((h) => h.group_name !== wheelGroup));
    return true;
  };

  const restoreWheelHistory = async (entries) => {
    if (!session?.user?.id) return false;
    if (!Array.isArray(entries) || entries.length === 0) return false;

    const payload = entries
      .map((item) => ({
        user_id: session.user.id,
        label: String(item?.label || '').trim(),
        group_name: String(item?.group_name || wheelGroup || '随机')
      }))
      .filter((item) => item.label);
    if (!payload.length) return false;

    const { data, error } = await supabase
      .from('wheel_history')
      .insert(payload)
      .select('id, label, group_name, created_at');
    if (error || !data) return false;

    setWheelHistory((prev) => {
      const merged = [...data, ...prev];
      return merged
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
    });
    return true;
  };

  const getLandedIndexByAngle = (angle, count) => {
    if (!count) return 0;
    const segment = 360 / count;
    const normalized = ((angle % 360) + 360) % 360;
    const mapped = ((360 - normalized) % 360) + 1e-7;
    return Math.floor(mapped / segment) % count;
  };

  const spinWheel = async () => {
    if (wheelSpinning || currentWheelOptions.length === 0) return;

    const count = currentWheelOptions.length;
    let index = Math.floor(Math.random() * count);
    if (count > 1 && wheelResult) {
      const picked = currentWheelOptions[index]?.label;
      if (picked === wheelResult) {
        index = (index + 1 + Math.floor(Math.random() * (count - 1))) % count;
      }
    }
    const segment = 360 / count;
    const edgePadding = segment * 0.18;
    const inSegmentOffset = edgePadding + Math.random() * Math.max(0, (segment - edgePadding * 2));
    const landedPointerAngle = index * segment + inSegmentOffset;
    const target = 360 * 4 + (360 - landedPointerAngle);
    wheelAngleRef.current = (wheelAngleRef.current + target) % 3600;
    setWheelSpinning(true);
    setWheelAngle(wheelAngleRef.current);

    const finalAngle = wheelAngleRef.current;
    spinTimerRef.current = setTimeout(async () => {
      const landedIndex = getLandedIndexByAngle(finalAngle, count);
      const landedLabel = currentWheelOptions[landedIndex]?.label || currentWheelOptions[index]?.label || '';
      if (!landedLabel) {
        setWheelSpinning(false);
        spinTimerRef.current = null;
        return;
      }

      setWheelResult(landedLabel);
      setWheelCreated(false);
      setWheelCreating(false);
      setWheelSpinning(false);
      spinTimerRef.current = null;

      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('wheel_history')
        .insert({ user_id: session.user.id, label: landedLabel, group_name: wheelGroup })
        .select('id, label, group_name, created_at')
        .single();
      if (data) {
        setWheelHistory((prev) => [data, ...prev].slice(0, 5));
      }
    }, 2600);
  };

  const createTaskFromWheel = async (label) => {
    if (!label || wheelCreated || wheelCreating) return;
    setWheelCreating(true);

    const mergedTags = Array.from(new Set([...(Array.isArray(tags) ? tags : []), '转盘']));

    try {
      const created = await createTask({
        input: label,
        note: String(note || '').trim(),
        dueDate: dueDate || '',
        priority,
        category,
        tags: mergedTags
      });
      if (!created) return;

      setWheelCreated(true);
    } finally {
      setWheelCreating(false);
    }
  };

  return {
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
    resetWheelData,
    clearWheelData
  };
};
