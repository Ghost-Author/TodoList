import React, { useEffect, useMemo, useState } from 'react';
import { Dice5, Sparkles } from 'lucide-react';
import WheelGroupBar from './wheel/WheelGroupBar.jsx';
import WheelCenterPanel from './wheel/WheelCenterPanel.jsx';
import WheelSettingsPanel from './wheel/WheelSettingsPanel.jsx';
import useWheelNoticeUndo from '../hooks/useWheelNoticeUndo.js';
import {
  QUICK_OPTIONS,
  WHEEL_UI_PREFS_KEY,
  MAX_OPTION_LENGTH,
  MAX_GROUP_LENGTH
} from './wheel/constants.js';
import {
  makeSegmentColor,
  countChars
} from './wheel/renderUtils.js';

const WheelPanel = ({
  loading = false,
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
  const [customCollapsed, setCustomCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const {
    notice,
    undoOption,
    undoHistory,
    showNotice,
    queueUndoOption,
    queueUndoHistory,
    handleUndoRemove,
    handleUndoHistoryClear
  } = useWheelNoticeUndo({
    onAddOption,
    onRestoreHistory
  });

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

        {loading ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <span key={idx} className="h-7 w-16 rounded-full bg-white/70 border border-[#ffe4f2] animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 md:gap-7">
              <div className="card-soft-sm p-4 flex flex-col items-center">
                <div className="w-[min(84vw,18rem)] h-[min(84vw,18rem)] md:w-72 md:h-72 rounded-full bg-white/70 border border-[#ffe4f2] animate-pulse" />
                <div className="mt-4 h-4 w-44 rounded-full bg-white/70 border border-[#ffe4f2] animate-pulse" />
                <div className="mt-3 h-8 w-36 rounded-full bg-white/70 border border-[#ffe4f2] animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="card-soft-sm p-4 space-y-3">
                  <div className="h-4 w-32 rounded bg-white/70 border border-[#ffe4f2] animate-pulse" />
                  <div className="h-9 w-full rounded-xl bg-white/70 border border-[#ffe4f2] animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-5 w-14 rounded-full bg-white/70 border border-[#ffe4f2] animate-pulse" />
                    <div className="h-5 w-14 rounded-full bg-white/70 border border-[#ffe4f2] animate-pulse" />
                    <div className="h-5 w-14 rounded-full bg-white/70 border border-[#ffe4f2] animate-pulse" />
                  </div>
                </div>
                <div className="card-soft-sm p-4 space-y-3">
                  <div className="h-4 w-36 rounded bg-white/70 border border-[#ffe4f2] animate-pulse" />
                  <div className="h-14 w-full rounded-xl bg-white/70 border border-[#ffe4f2] animate-pulse" />
                  <div className="h-14 w-full rounded-xl bg-white/70 border border-[#ffe4f2] animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <WheelGroupBar
              groups={groups}
              currentGroup={currentGroup}
              onGroupChange={onGroupChange}
              onAddGroup={onAddGroup}
              onRenameGroup={onRenameGroup}
              onDeleteGroup={onDeleteGroup}
              showNotice={showNotice}
              maxGroupLength={MAX_GROUP_LENGTH}
            />

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
          </>
        )}
      </div>
    </div>
  );
};

export default WheelPanel;
