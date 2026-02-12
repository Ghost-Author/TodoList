import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dice5, Plus, X, Sparkles, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_COLORS = [
  '#ffd6e8',
  '#c9f2ff',
  '#ffe7b3',
  '#d7f8e1',
  '#f3d8ff',
  '#ffefc6',
  '#cfe8ff',
  '#ffd1dc'
];
const QUICK_OPTIONS = ['喝水', '伸展 3 分钟', '清理桌面', '番茄钟 25 分钟', '散步 10 分钟', '写今日复盘'];
const WHEEL_UI_PREFS_KEY = 'wheel_panel_ui_prefs_v1';
const MAX_OPTION_LENGTH = 32;
const MAX_GROUP_LENGTH = 16;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const toChars = (value) => Array.from(String(value || ''));
const hexToRgb = (hex) => {
  const clean = String(hex || '').replace('#', '');
  if (clean.length !== 6) return { r: 255, g: 255, b: 255 };
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};
const getLuma = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const makeSegmentColor = (idx, count) => {
  if (count <= DEFAULT_COLORS.length) return DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
  const baseHue = (idx * 137.508) % 360;
  const sat = idx % 2 === 0 ? 78 : 72;
  const light = idx % 3 === 0 ? 86 : idx % 3 === 1 ? 82 : 88;
  return `hsl(${Math.round(baseHue)} ${sat}% ${light}%)`;
};

const getDisplayLabel = (segmentDeg, label) => {
  const raw = String(label || '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  const [firstPhrase] = raw.split(/[，,。.!！?？;；:：|/]/).filter(Boolean);
  const candidate = (firstPhrase || raw).trim();
  const chars = toChars(candidate);
  const maxChars = segmentDeg >= 56 ? 9 : segmentDeg >= 44 ? 8 : segmentDeg >= 30 ? 7 : segmentDeg >= 22 ? 5 : 4;
  if (chars.length <= maxChars) return candidate;
  return `${chars.slice(0, Math.max(1, maxChars - 1)).join('')}…`;
};

const getLabelLayout = (segmentDeg) => {
  const fontSize = segmentDeg >= 60 ? 11 : segmentDeg >= 45 ? 10 : segmentDeg >= 30 ? 9 : segmentDeg >= 22 ? 8 : 7;
  const radius = segmentDeg >= 55 ? 74 : segmentDeg >= 36 ? 77 : segmentDeg >= 24 ? 80 : 84;
  const arcLength = (Math.PI * 2 * radius) * (segmentDeg / 360);
  const maxWidth = clamp(Math.round(arcLength * 0.88), 32, 98);
  return { fontSize, radius, maxWidth };
};

const getTextTone = (color) => {
  if (String(color).startsWith('hsl')) return '#3b2e4a';
  const rgb = hexToRgb(color);
  const luma = getLuma(rgb);
  if (luma < 0.6) return '#2f2539';
  if (luma > 0.86) return '#4a3b5a';
  return '#3b2e4a';
};

const WheelPanel = ({
  groups,
  currentGroup,
  onGroupChange,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  onClearHistory,
  onRestoreHistory,
  options,
  history,
  spinning,
  angle,
  result,
  created,
  creating,
  onSpin,
  onAddOption,
  onRemoveOption,
  onCreateTask,
  onOpenTasks
}) => {
  const [newOption, setNewOption] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [customCollapsed, setCustomCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [notice, setNotice] = useState('');
  const [undoOption, setUndoOption] = useState(null);
  const [undoHistory, setUndoHistory] = useState(null);
  const noticeTimerRef = useRef(null);
  const undoTimerRef = useRef(null);
  const undoHistoryTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(noticeTimerRef.current);
      window.clearTimeout(undoTimerRef.current);
      window.clearTimeout(undoHistoryTimerRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WHEEL_UI_PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.customCollapsed === 'boolean') setCustomCollapsed(parsed.customCollapsed);
      if (typeof parsed.historyCollapsed === 'boolean') setHistoryCollapsed(parsed.historyCollapsed);
    } catch {
      // Ignore invalid localStorage data.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        WHEEL_UI_PREFS_KEY,
        JSON.stringify({ customCollapsed, historyCollapsed })
      );
    } catch {
      // Ignore localStorage failures.
    }
  }, [customCollapsed, historyCollapsed]);

  const showNotice = (text) => {
    setNotice(text);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), 1500);
  };

  const queueUndoOption = (label) => {
    window.clearTimeout(undoTimerRef.current);
    setUndoOption({ label });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoOption(null);
    }, 5000);
  };

  const handleUndoRemove = async () => {
    if (!undoOption?.label) return;
    const ok = await onAddOption(undoOption.label);
    if (ok !== false) {
      setUndoOption(null);
      window.clearTimeout(undoTimerRef.current);
      showNotice('已撤销删除');
      return;
    }
    showNotice('撤销失败');
  };

  const queueUndoHistory = (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    window.clearTimeout(undoHistoryTimerRef.current);
    setUndoHistory(items);
    undoHistoryTimerRef.current = window.setTimeout(() => {
      setUndoHistory(null);
    }, 5000);
  };

  const handleUndoHistoryClear = async () => {
    if (!undoHistory || !onRestoreHistory) return;
    const ok = await onRestoreHistory(undoHistory);
    if (ok !== false) {
      setUndoHistory(null);
      window.clearTimeout(undoHistoryTimerRef.current);
      showNotice('已恢复清空记录');
      return;
    }
    showNotice('恢复记录失败');
  };

  const { gradient, segmentColors } = useMemo(() => {
    if (!options.length) {
      return {
        gradient: 'conic-gradient(#f3f4f6 0 360deg)',
        segmentColors: []
      };
    }
    const step = 360 / options.length;
    const colors = options.map((_, idx) => makeSegmentColor(idx, options.length));
    const parts = options.map((_, idx) => {
      const start = idx * step;
      const end = (idx + 1) * step;
      const color = colors[idx];
      return `${color} ${start}deg ${end}deg`;
    });
    return {
      gradient: `conic-gradient(${parts.join(', ')})`,
      segmentColors: colors
    };
  }, [options]);

  const canAddOption = (value) => {
    const val = String(value || '').trim();
    if (!val) {
      showNotice('请输入选项内容');
      return false;
    }
    if (toChars(val).length > MAX_OPTION_LENGTH) {
      showNotice(`选项最多 ${MAX_OPTION_LENGTH} 个字符`);
      return false;
    }
    const exists = options.some((opt) => String(opt.label || '').trim() === val);
    if (exists) {
      showNotice('该选项已存在');
      return false;
    }
    return true;
  };

  const canAddGroup = (value) => {
    const val = String(value || '').trim();
    if (!val) {
      showNotice('请输入分组名称');
      return false;
    }
    if (toChars(val).length > MAX_GROUP_LENGTH) {
      showNotice(`分组名最多 ${MAX_GROUP_LENGTH} 个字符`);
      return false;
    }
    if (val === '随机') {
      showNotice('“随机”为系统分组');
      return false;
    }
    if ((groups || []).includes(val)) {
      showNotice('该分组已存在');
      return false;
    }
    return true;
  };

  const submitNewGroup = async () => {
    if (!canAddGroup(newGroup)) return;
    const ok = await onAddGroup(newGroup.trim());
    if (ok !== false) {
      setNewGroup('');
      showNotice('分组已创建');
    } else {
      showNotice('新建分组失败');
    }
  };

  const submitNewOption = async (value) => {
    if (!canAddOption(value)) return;
    const ok = await onAddOption(String(value).trim());
    if (ok !== false) {
      if (String(value).trim() === newOption.trim()) {
        setNewOption('');
      }
      showNotice('选项已添加');
    } else {
      showNotice('添加选项失败');
    }
  };

  return (
    <div className="card-soft p-4 md:p-7 overflow-hidden relative">
      <div className="wheel-cloud wheel-cloud-a" />
      <div className="wheel-cloud wheel-cloud-b" />
      <div className="wheel-cloud wheel-cloud-c" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#3b2e4a] flex items-center gap-2">
              <Dice5 className="w-5 h-5 text-[#ff8acb]" /> 棉花糖转盘
            </h3>
            <p className="text-xs text-[#7b6f8c] mt-1">轻轻一转，今天的小行动就出现啦。</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6fb1] bg-white/80 border border-[#ffd7ea] px-3 py-1 rounded-full self-start md:self-auto">
            <Sparkles className="w-3 h-3" /> Sweet Spin
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {groups.map((g) => (
            <div key={g} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onGroupChange(g)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  currentGroup === g
                    ? 'bg-[#ff8acb] text-white border-[#ff8acb] shadow-[0_6px_16px_rgba(255,138,203,0.35)]'
                    : 'bg-white/85 text-[#7b6f8c] border-[#ffe4f2] hover:border-[#ffb6d8]'
                }`}
              >
                {g}
              </button>
              {g !== '随机' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroup(g);
                      setEditingName(g);
                    }}
                    className="text-[#7b6f8c] hover:text-[#ff6fb1]"
                    title="重命名"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteGroup(g);
                    }}
                    className="text-[#7b6f8c] hover:text-red-500"
                    title="删除分组"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 ml-1">
            <input
              type="text"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                await submitNewGroup();
              }}
              placeholder="新增分组"
              maxLength={MAX_GROUP_LENGTH + 8}
              className="text-xs bg-white/85 rounded-full px-3 py-1 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
            />
            <button
              type="button"
              className="text-xs font-bold text-white bg-[#ff8acb] px-3 py-1 rounded-full shadow-[0_8px_16px_rgba(255,138,203,0.35)]"
              onClick={submitNewGroup}
            >
              新建
            </button>
          </div>
        </div>

        {editingGroup && (
          <div className="mb-4 flex items-center gap-2 text-xs bg-white/85 border border-[#ffe4f2] rounded-xl px-3 py-2">
            <span className="text-[#7b6f8c]">重命名分组：</span>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="flex-1 text-xs bg-transparent outline-none"
            />
            <button
              type="button"
              className="text-xs font-bold text-white bg-[#ff8acb] px-2 py-1 rounded-full"
              onClick={async () => {
                const ok = await onRenameGroup(editingGroup, editingName);
                if (ok !== false) {
                  setEditingGroup(null);
                  setEditingName('');
                }
              }}
            >
              保存
            </button>
            <button
              type="button"
              className="text-xs text-[#7b6f8c]"
              onClick={() => {
                setEditingGroup(null);
                setEditingName('');
              }}
            >
              取消
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 md:gap-7">
          <div className="flex flex-col items-center">
            <div className="relative w-[min(84vw,18rem)] h-[min(84vw,18rem)] md:w-72 md:h-72 wheel-orbit">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#ff6fb1] drop-shadow-[0_4px_6px_rgba(255,111,177,0.45)]" />
              </div>

              <div className="absolute inset-0 rounded-full bg-white/50 border border-[#ffd7ea]" />
              <div className="absolute inset-2 rounded-full border-2 border-white/80 shadow-inner" />
              <div
                className="absolute inset-4 rounded-full border border-[#ffe4f2] shadow-sm"
                style={{
                  backgroundImage: gradient,
                  transform: `rotate(${angle}deg)`,
                  transition: spinning ? 'transform 2.6s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                }}
              />

              {options.map((opt, idx) => {
                const step = 360 / options.length;
                const deg = idx * step + step / 2;
                const segmentColor = segmentColors[idx];
                const layout = getLabelLayout(step);
                const displayLabel = getDisplayLabel(step, opt.label);
                const textTone = getTextTone(segmentColor);
                return (
                  <div
                    key={opt.id}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      transform: `rotate(${deg + angle}deg)`,
                      transition: spinning ? 'transform 2.6s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                    }}
                  >
                    <span
                      className="wheel-segment-text wheel-segment-label-chip font-bold text-center px-1.5 py-0.5 rounded-lg"
                      style={{
                        transform: `translateY(-${layout.radius}px) rotate(-90deg)`,
                        fontSize: `${layout.fontSize}px`,
                        lineHeight: 1.08,
                        color: textTone,
                        maxWidth: `${layout.maxWidth}px`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={opt.label}
                    >
                      {displayLabel}
                    </span>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={onSpin}
                disabled={spinning || options.length === 0}
                className="absolute inset-[34%] rounded-full wheel-core-btn disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="点击转动转盘"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7b6f8c]">今日灵感</div>
                <div className="text-sm font-bold text-[#3b2e4a] mt-1">{spinning ? '转动中...' : '点我开转'}</div>
              </button>

              <div className="wheel-twinkle wheel-twinkle-a" />
              <div className="wheel-twinkle wheel-twinkle-b" />
            </div>

            <div className="mt-4 text-[11px] text-[#7b6f8c] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 结果仅提示，不会自动创建任务
            </div>

            <div className="mt-3 min-h-[34px] flex items-center">
              {result && (
                <div className="wheel-result-pop w-full max-w-[320px] card-soft-sm px-3 py-2.5">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b6f8c]">抽取结果</div>
                  <div className="mt-1 text-sm font-bold text-[#ff6fb1] break-words">{result}</div>
                  <div className="mt-1 text-[10px] text-[#7b6f8c]">
                    {created ? '任务已创建，可前往任务页查看。' : '确认后可一键创建为任务。'}
                  </div>
                </div>
              )}
            </div>

            {result && (
              <div className="mt-2 w-full max-w-[320px] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCreateTask(result)}
                  disabled={created || creating}
                  className="wheel-result-pop text-xs font-bold text-white bg-[#ff8acb] px-4 py-2 rounded-full shadow-[0_10px_20px_rgba(255,138,203,0.32)] disabled:opacity-60"
                >
                  {created ? '已创建任务' : creating ? '创建中...' : '一键创建任务'}
                </button>
                {created && (
                  <button
                    type="button"
                    onClick={() => onOpenTasks?.()}
                    className="text-xs font-bold text-[#7b6f8c] bg-white/90 border border-[#ffe4f2] px-3 py-2 rounded-full"
                  >
                    去任务页查看
                  </button>
                )}
              </div>
            )}
            <div className="mt-2 min-h-[18px] text-[11px] text-[#7b6f8c]">
              {notice}
            </div>
            {undoOption?.label && (
              <div className="mt-1 text-[11px] text-[#7b6f8c] flex items-center gap-2 w-full max-w-[320px]">
                <span className="truncate">已删除：{undoOption.label}</span>
                <button
                  type="button"
                  onClick={handleUndoRemove}
                  className="px-2 py-0.5 rounded-full bg-white/90 border border-[#ffe4f2] text-[#ff6fb1] font-bold shrink-0"
                >
                  撤销
                </button>
              </div>
            )}
            {undoHistory && (
              <div className="mt-1 text-[11px] text-[#7b6f8c] flex items-center gap-2 w-full max-w-[320px]">
                <span className="truncate">已清空 {undoHistory.length} 条记录</span>
                <button
                  type="button"
                  onClick={handleUndoHistoryClear}
                  className="px-2 py-0.5 rounded-full bg-white/90 border border-[#ffe4f2] text-[#ff6fb1] font-bold shrink-0"
                >
                  撤销
                </button>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="card-soft-sm p-3.5 md:p-4">
              <button
                type="button"
                onClick={() => setCustomCollapsed((prev) => !prev)}
                className="w-full flex items-center justify-between mb-2"
              >
                <div className="text-xs font-black text-[#7b6f8c] uppercase tracking-widest">
                  自定义转盘 ({options.length})
                </div>
                {customCollapsed ? <ChevronDown className="w-4 h-4 text-[#7b6f8c]" /> : <ChevronUp className="w-4 h-4 text-[#7b6f8c]" />}
              </button>
              {!customCollapsed && (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        await submitNewOption(newOption);
                      }}
                      placeholder="输入想要转到的事项"
                      maxLength={MAX_OPTION_LENGTH + 10}
                      className="flex-1 min-w-0 text-sm bg-white/85 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                    />
                    <button
                      type="button"
                      className="px-3 rounded-xl bg-[#ff8acb] text-white shadow-[0_8px_16px_rgba(255,138,203,0.35)]"
                      onClick={() => submitNewOption(newOption)}
                      title="添加选项"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-[#7b6f8c] font-black uppercase tracking-[0.12em]">快捷添加</span>
                    {QUICK_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => submitNewOption(item)}
                        className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/85 border border-[#ffe4f2] text-[#7b6f8c] hover:text-[#ff6fb1]"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 max-h-36 overflow-y-auto pr-1">
                    {options.length === 0 && <div className="text-xs text-slate-400">还没有选项，先加几个吧。</div>}
                    {options.map((opt) => (
                      <span key={opt.id} className="text-xs bg-white/90 border border-[#ffe4f2] rounded-full px-3 py-1 flex items-center gap-1 text-[#3b2e4a]">
                        {opt.label}
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await onRemoveOption(opt.id);
                            if (ok !== false) {
                              showNotice('选项已删除');
                              queueUndoOption(opt.label);
                            }
                          }}
                          className="text-[#ff6fb1]"
                          title="删除"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card-soft-sm p-3.5 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setHistoryCollapsed((prev) => !prev)}
                  className="flex items-center gap-2"
                >
                  <div className="text-xs font-black text-[#7b6f8c] uppercase tracking-widest">最近 5 次结果 ({history.length})</div>
                  {historyCollapsed ? <ChevronDown className="w-4 h-4 text-[#7b6f8c]" /> : <ChevronUp className="w-4 h-4 text-[#7b6f8c]" />}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!history.length) {
                      showNotice('当前分组暂无记录');
                      return;
                    }
                    const snapshot = history.map((item) => ({
                      label: item.label,
                      group_name: item.group_name || currentGroup
                    }));
                    const ok = await onClearHistory();
                    if (ok !== false) {
                      showNotice('记录已清空');
                      queueUndoHistory(snapshot);
                    }
                  }}
                  disabled={!history.length}
                  className="text-[10px] text-[#7b6f8c] hover:text-[#ff6fb1] disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  清空当前分组
                </button>
              </div>
              {!historyCollapsed && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {history.length === 0 && (
                  <div className="text-xs text-slate-400">还没有转动记录</div>
                )}
                {history.map((item, idx) => (
                  <div key={item.id} className="relative pl-5">
                    {idx !== history.length - 1 && (
                      <span className="absolute left-[6px] top-5 bottom-[-8px] w-px bg-[#ffe4f2]" aria-hidden="true" />
                    )}
                    <span
                      className="absolute left-0 top-[9px] w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ background: '#ff9ccc' }}
                      aria-hidden="true"
                    />
                    <div className="text-sm text-[#3b2e4a] bg-white/85 border border-[#ffe4f2] rounded-xl px-3 py-2">
                      <span className="font-semibold">{item.label}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{new Date(item.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelPanel;
