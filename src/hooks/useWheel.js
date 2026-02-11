import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

const DEFAULT_GROUPS = ['随机', '工作', '生活'];
const DEFAULT_OPTIONS = ['整理桌面 5 分钟', '喝一杯水', '伸展一下', '列 3 个小目标', '处理一个小任务', '站起来走一走'];

export const useWheel = ({ session, createTask, priority, category }) => {
  const [wheelOptions, setWheelOptions] = useState([]);
  const [wheelHistory, setWheelHistory] = useState([]);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelResult, setWheelResult] = useState('');
  const [wheelCreated, setWheelCreated] = useState(false);
  const [wheelGroups, setWheelGroups] = useState(DEFAULT_GROUPS);
  const [wheelGroup, setWheelGroup] = useState('随机');
  const wheelAngleRef = useRef(0);
  const spinTimerRef = useRef(null);

  const resetWheelData = () => {
    setWheelOptions([]);
    setWheelHistory([]);
    setWheelSpinning(false);
    setWheelAngle(0);
    setWheelResult('');
    setWheelCreated(false);
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

    const loadWheel = async () => {
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

      if (!mounted) return;

      if (groupRes.data && groupRes.data.length > 0) {
        const names = groupRes.data.map((g) => g.name);
        setWheelGroups(['随机', ...names.filter((n) => n !== '随机')]);
      } else {
        setWheelGroups(DEFAULT_GROUPS);
      }

      if (optRes.data && optRes.data.length > 0) {
        setWheelOptions(optRes.data);
      } else {
        const { data: seeded } = await supabase
          .from('wheel_options')
          .insert(DEFAULT_OPTIONS.map((label) => ({ user_id: userId, label, group_name: '随机' })))
          .select('id, label, group_name, created_at')
          .order('created_at', { ascending: true });
        if (seeded && mounted) setWheelOptions(seeded);
      }

      if (histRes.data) {
        setWheelHistory(histRes.data);
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

  const spinWheel = async () => {
    if (wheelSpinning || currentWheelOptions.length === 0) return;

    const count = currentWheelOptions.length;
    const index = Math.floor(Math.random() * count);
    const segment = 360 / count;
    const target = 360 * 4 + (360 - (index * segment + segment / 2));
    wheelAngleRef.current = (wheelAngleRef.current + target) % 3600;
    setWheelSpinning(true);
    setWheelAngle(wheelAngleRef.current);

    const label = currentWheelOptions[index].label;
    spinTimerRef.current = setTimeout(async () => {
      setWheelResult(label);
      setWheelCreated(false);
      setWheelSpinning(false);
      spinTimerRef.current = null;

      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('wheel_history')
        .insert({ user_id: session.user.id, label, group_name: wheelGroup })
        .select('id, label, group_name, created_at')
        .single();
      if (data) {
        setWheelHistory((prev) => [data, ...prev].slice(0, 5));
      }
    }, 2600);
  };

  const createTaskFromWheel = async (label) => {
    if (!label || wheelCreated) return;

    const created = await createTask({
      input: label,
      note: '',
      dueDate: '',
      priority,
      category,
      tags: []
    });
    if (!created) return;

    setWheelCreated(true);
  };

  return {
    wheelGroups,
    wheelGroup,
    setWheelGroup,
    wheelSpinning,
    wheelAngle,
    wheelResult,
    wheelCreated,
    currentWheelOptions,
    currentWheelHistory,
    addWheelOption,
    removeWheelOption,
    addWheelGroup,
    renameWheelGroup,
    deleteWheelGroup,
    clearWheelHistory,
    spinWheel,
    createTaskFromWheel,
    resetWheelData,
    clearWheelData
  };
};
