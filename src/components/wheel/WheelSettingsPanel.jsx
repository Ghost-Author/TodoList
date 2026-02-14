import React from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const WheelSettingsPanel = ({
  customCollapsed,
  setCustomCollapsed,
  historyCollapsed,
  setHistoryCollapsed,
  options,
  newOption,
  setNewOption,
  submitNewOption,
  maxOptionLength,
  quickOptions,
  onRemoveOption,
  history,
  currentGroup,
  onClearHistoryWithUndo
}) => (
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
          <div className="flex flex-wrap gap-2 mt-3 max-h-36 overflow-y-auto pr-1">
            {options.length === 0 && <div className="text-xs text-slate-400">还没有选项，先加几个吧。</div>}
            {options.map((opt) => (
              <span key={opt.id} className="text-xs bg-white/90 border border-[#ffe4f2] rounded-full px-3 py-1 flex items-center gap-1 text-[#3b2e4a]">
                {opt.label}
                <button
                  type="button"
                  onClick={async () => {
                    await onRemoveOption(opt);
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
);

export default WheelSettingsPanel;

