import React, { useMemo, useState } from 'react';
import { Dice5, Plus, X, Sparkles } from 'lucide-react';

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

const WheelPanel = ({
  groups,
  currentGroup,
  onGroupChange,
  options,
  history,
  spinning,
  angle,
  result,
  onSpin,
  onAddOption,
  onRemoveOption,
  onCreateTask
}) => {
  const [newOption, setNewOption] = useState('');

  const gradient = useMemo(() => {
    if (!options.length) return 'conic-gradient(#f3f4f6 0 360deg)';
    const step = 360 / options.length;
    const parts = options.map((_, idx) => {
      const start = idx * step;
      const end = (idx + 1) * step;
      const color = DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
      return `${color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }, [options]);

  return (
    <div className="card-soft p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#3b2e4a] flex items-center gap-2">
            <Dice5 className="w-5 h-5 text-[#ff8acb]" /> 不知道想干什么？转一下
          </h3>
          <p className="text-xs text-[#7b6f8c] mt-1">随机给自己一个小行动，轻松开始。</p>
        </div>
        <button
          type="button"
          onClick={onSpin}
          disabled={spinning || options.length === 0}
          className="btn-soft px-4 py-2 rounded-2xl text-sm font-bold disabled:opacity-60"
        >
          {spinning ? '转盘中…' : '开始转'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onGroupChange(g)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              currentGroup === g
                ? 'bg-[#ff8acb] text-white border-[#ff8acb]'
                : 'bg-white/80 text-[#7b6f8c] border-[#ffe4f2]'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <div className="flex flex-col items-center">
          <div className="relative w-56 h-56">
            <div
              className="absolute inset-0 rounded-full border border-[#ffe4f2] shadow-sm"
              style={{
                backgroundImage: gradient,
                transform: `rotate(${angle}deg)`,
                transition: spinning ? 'transform 2.6s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
              }}
            />
            <div className="absolute inset-6 rounded-full bg-white/80 border border-[#ffe4f2] flex items-center justify-center text-center px-4">
              <div>
                <div className="text-[10px] font-black text-[#7b6f8c] uppercase tracking-[0.2em]">今日灵感</div>
                <div className="text-sm font-bold text-[#3b2e4a] mt-2 min-h-[2.5rem] flex items-center justify-center">
                  {result || '点击开始转'}
                </div>
              </div>
            </div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-[#ff8acb]" />
          </div>
          <div className="mt-4 text-[11px] text-[#7b6f8c] flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> 结果仅提示，不会自动创建任务
          </div>
          {result && (
            <button
              type="button"
              onClick={() => onCreateTask(result)}
              className="mt-3 text-xs font-bold text-white bg-[#ff8acb] px-3 py-1.5 rounded-full"
            >
              一键创建任务
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-black text-[#7b6f8c] uppercase tracking-widest mb-2">自定义转盘</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="输入想要转到的事项"
                className="flex-1 text-sm bg-white/80 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
              />
              <button
                type="button"
                className="px-3 rounded-xl bg-[#ff8acb] text-white"
                onClick={() => {
                  const val = newOption.trim();
                  if (!val) return;
                  onAddOption(val);
                  setNewOption('');
                }}
                title="添加选项"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {options.map((opt) => (
                <span key={opt.id} className="text-xs bg-white/80 border border-[#ffe4f2] rounded-full px-3 py-1 flex items-center gap-1">
                  {opt.label}
                  <button
                    type="button"
                    onClick={() => onRemoveOption(opt.id)}
                    className="text-[#ff6fb1]"
                    title="删除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-black text-[#7b6f8c] uppercase tracking-widest mb-2">最近 5 次结果</div>
            <div className="space-y-2">
              {history.length === 0 && (
                <div className="text-xs text-slate-400">还没有转动记录</div>
              )}
              {history.map((item) => (
                <div key={item.id} className="text-sm text-[#3b2e4a] bg-white/70 border border-[#ffe4f2] rounded-xl px-3 py-2">
                  {item.label}
                  <span className="text-[10px] text-slate-400 ml-2">{new Date(item.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelPanel;
