import React, { useMemo } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import WheelOptionChip from './WheelOptionChip.jsx';
import WheelHistoryDayGroup from './WheelHistoryDayGroup.jsx';

const WheelSettingsPanel = ({
  customCollapsed,
  setCustomCollapsed,
  historyCollapsed,
  setHistoryCollapsed,
  options,
  getOptionWeight,
  onOptionWeightChange,
  newOption,
  setNewOption,
  submitNewOption,
  maxOptionLength,
  quickOptions,
  onRemoveOption,
  history,
  currentGroup,
  onClearHistoryWithUndo
}) => {
  const groupedHistory = useMemo(() => {
    const map = new Map();
    const makeLocalDateKey = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    history.forEach((item) => {
      const date = new Date(item.created_at);
      const dateValid = !Number.isNaN(date.getTime());
      const key = dateValid ? makeLocalDateKey(date) : 'unknown';
      const label = dateValid
        ? date.toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          })
        : '未知日期';

      if (!map.has(key)) {
        map.set(key, { key, dateLabel: label, items: [] });
      }
      map.get(key).items.push(item);
    });

    return Array.from(map.values());
  }, [history]);

  return (
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
                maxLength={maxOptionLength + 10}
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
              {quickOptions.map((item) => (
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
            <div className="mt-2 text-[10px] text-[#7b6f8c]">权重 `x1-x5`：数值越高，被抽中的概率越高。</div>
            <div className="flex flex-wrap gap-2 mt-3 max-h-36 overflow-y-auto pr-1">
              {options.length === 0 && <div className="text-xs text-slate-400">还没有选项，先加几个吧。</div>}
              {options.map((opt) => (
                <WheelOptionChip
                  key={opt.id}
                  option={opt}
                  weight={getOptionWeight?.(opt.id) || 1}
                  onWeightChange={onOptionWeightChange}
                  onRemove={onRemoveOption}
                />
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
            onClick={() => onClearHistoryWithUndo(history, currentGroup)}
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
            {groupedHistory.map((group) => (
              <WheelHistoryDayGroup key={group.key} dateLabel={group.dateLabel} items={group.items} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WheelSettingsPanel;
