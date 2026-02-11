import React, { useMemo, useState } from 'react';
import { Dice5, Plus, X, Sparkles, Edit2, Trash2 } from 'lucide-react';

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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const toChars = (value) => Array.from(String(value || ''));
const sliceChars = (value, count) => toChars(value).slice(0, count).join('');

const getDisplayLabel = (segmentDeg, label) => {
  const raw = String(label || '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';

  const [firstPhrase] = raw.split(/[，,。.!！?？;；:：|/]/).filter(Boolean);
  const candidate = (firstPhrase || raw).trim();

  const maxChars = segmentDeg < 18 ? 6 : segmentDeg < 24 ? 8 : segmentDeg < 32 ? 10 : 14;
  const chars = toChars(candidate);
  if (chars.length <= maxChars) return candidate;
  return `${sliceChars(candidate, maxChars)}…`;
};

const getLabelLayout = (segmentDeg, labelLength) => {
  const baseFont = segmentDeg >= 60 ? 11 : segmentDeg >= 45 ? 10 : segmentDeg >= 30 ? 9 : segmentDeg >= 22 ? 8 : 7;
  const textPenalty = Math.max(0, Math.ceil((labelLength - 8) / 6));
  const fontSize = clamp(baseFont - textPenalty, 6, 11);

  const radius = segmentDeg >= 55 ? 74 : segmentDeg >= 36 ? 77 : segmentDeg >= 24 ? 80 : 84;
  const arcLength = (Math.PI * 2 * radius) * (segmentDeg / 360);
  const maxWidth = clamp(Math.round(arcLength * 0.9), 38, 100);
  const lineClamp = segmentDeg < 18 ? 1 : 2;

  return { fontSize, radius, maxWidth, lineClamp };
};

const WheelPanel = ({
  groups,
  currentGroup,
  onGroupChange,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  onClearHistory,
  options,
  history,
  spinning,
  angle,
  result,
  created,
  onSpin,
  onAddOption,
  onRemoveOption,
  onCreateTask
}) => {
  const [newOption, setNewOption] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingName, setEditingName] = useState('');

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
    <div className="card-soft p-6 md:p-7 overflow-hidden relative">
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
                    onClick={() => onDeleteGroup(g)}
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
              placeholder="新增分组"
              className="text-xs bg-white/85 rounded-full px-3 py-1 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
            />
            <button
              type="button"
              className="text-xs font-bold text-white bg-[#ff8acb] px-3 py-1 rounded-full shadow-[0_8px_16px_rgba(255,138,203,0.35)]"
              onClick={() => {
                const val = newGroup.trim();
                if (!val) return;
                onAddGroup(val);
                setNewGroup('');
              }}
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
              onClick={() => {
                onRenameGroup(editingGroup, editingName);
                setEditingGroup(null);
                setEditingName('');
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

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-7">
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 md:w-72 md:h-72 wheel-orbit">
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
                const displayLabel = getDisplayLabel(step, opt.label);
                const layout = getLabelLayout(step, displayLabel.length);
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
                      className="font-bold text-[#3b2e4a] px-2 py-1 rounded-full bg-white/75 border border-[#ffe4f2] text-center shadow-sm"
                      style={{
                        transform: `translateY(-${layout.radius}px) rotate(-90deg)`,
                        fontSize: `${layout.fontSize}px`,
                        maxWidth: `${layout.maxWidth}px`,
                        lineHeight: 1.15,
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: layout.lineClamp,
                        WebkitBoxOrient: 'vertical',
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
                <span className="text-xs font-bold text-[#ff6fb1] bg-white/90 border border-[#ffd7ea] px-3 py-1 rounded-full shadow-sm">
                  抽到：{result}
                </span>
              )}
            </div>

            {result && (
              <button
                type="button"
                onClick={() => onCreateTask(result)}
                disabled={created}
                className="mt-2 text-xs font-bold text-white bg-[#ff8acb] px-4 py-2 rounded-full shadow-[0_10px_20px_rgba(255,138,203,0.32)] disabled:opacity-60"
              >
                {created ? '已创建任务' : '一键创建任务'}
              </button>
            )}
          </div>

          <div className="space-y-5">
            <div className="card-soft-sm p-4">
              <div className="text-xs font-black text-[#7b6f8c] uppercase tracking-widest mb-2">自定义转盘</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="输入想要转到的事项"
                  className="flex-1 text-sm bg-white/85 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                />
                <button
                  type="button"
                  className="px-3 rounded-xl bg-[#ff8acb] text-white shadow-[0_8px_16px_rgba(255,138,203,0.35)]"
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
                {options.length === 0 && <div className="text-xs text-slate-400">还没有选项，先加几个吧。</div>}
                {options.map((opt) => (
                  <span key={opt.id} className="text-xs bg-white/90 border border-[#ffe4f2] rounded-full px-3 py-1 flex items-center gap-1 text-[#3b2e4a]">
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

            <div className="card-soft-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-black text-[#7b6f8c] uppercase tracking-widest">最近 5 次结果</div>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-[10px] text-[#7b6f8c] hover:text-[#ff6fb1]"
                >
                  清空当前分组
                </button>
              </div>
              <div className="space-y-2">
                {history.length === 0 && (
                  <div className="text-xs text-slate-400">还没有转动记录</div>
                )}
                {history.map((item) => (
                  <div key={item.id} className="text-sm text-[#3b2e4a] bg-white/85 border border-[#ffe4f2] rounded-xl px-3 py-2">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WheelPanel;
