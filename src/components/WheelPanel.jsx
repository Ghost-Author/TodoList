import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dice5, Sparkles, Edit2, Trash2 } from 'lucide-react';
import WheelCenterPanel from './wheel/WheelCenterPanel.jsx';
import WheelSettingsPanel from './wheel/WheelSettingsPanel.jsx';
import {
  QUICK_OPTIONS,
  WHEEL_UI_PREFS_KEY,
  MAX_OPTION_LENGTH,
  MAX_GROUP_LENGTH
} from './wheel/constants.js';
import {
  makeSegmentColor,
  getDisplayLabel,
  getLabelLayout,
  getTextTone,
  countChars
} from './wheel/renderUtils.js';

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
    if (countChars(val) > MAX_OPTION_LENGTH) {
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
    if (countChars(val) > MAX_GROUP_LENGTH) {
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

  const handleRemoveOption = async (opt) => {
    const ok = await onRemoveOption(opt.id);
    if (ok !== false) {
      showNotice('选项已删除');
      queueUndoOption(opt.label);
    }
  };

  const clearHistoryWithUndo = async (list, groupName) => {
    if (!list.length) {
      showNotice('当前分组暂无记录');
      return;
    }
    const snapshot = list.map((item) => ({
      label: item.label,
      group_name: item.group_name || groupName
    }));
    const ok = await onClearHistory();
    if (ok !== false) {
      showNotice('记录已清空');
      queueUndoHistory(snapshot);
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
          <WheelCenterPanel
            options={options}
            gradient={gradient}
            angle={angle}
            spinning={spinning}
            segmentColors={segmentColors}
            onSpin={onSpin}
            result={result}
            created={created}
            creating={creating}
            onCreateTask={onCreateTask}
            onOpenTasks={onOpenTasks}
            notice={notice}
            undoOption={undoOption}
            undoHistory={undoHistory}
            onUndoRemove={handleUndoRemove}
            onUndoHistoryClear={handleUndoHistoryClear}
          />
          <WheelSettingsPanel
            customCollapsed={customCollapsed}
            setCustomCollapsed={setCustomCollapsed}
            historyCollapsed={historyCollapsed}
            setHistoryCollapsed={setHistoryCollapsed}
            options={options}
            newOption={newOption}
            setNewOption={setNewOption}
            submitNewOption={submitNewOption}
            maxOptionLength={MAX_OPTION_LENGTH}
            quickOptions={QUICK_OPTIONS}
            onRemoveOption={handleRemoveOption}
            history={history}
            currentGroup={currentGroup}
            onClearHistoryWithUndo={clearHistoryWithUndo}
          />
        </div>
      </div>
    </div>
  );
};

export default WheelPanel;
