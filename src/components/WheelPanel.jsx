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

const getDisplayLabelToken = (segmentDeg, label) => {
  const raw = String(label || '').trim().replace(/\s+/g, ' ');
  if (!raw) return { lines: [''], plain: '' };

  const candidate = raw;
  const chars = toChars(candidate);
  if (chars.length === 0) return { lines: [''], plain: '' };

  const lineChars = segmentDeg >= 56 ? 10 : segmentDeg >= 44 ? 9 : segmentDeg >= 30 ? 8 : segmentDeg >= 22 ? 6 : 4;
  const maxLines = segmentDeg >= 56 ? 4 : segmentDeg >= 42 ? 3 : segmentDeg >= 22 ? 2 : 1;
  const maxChars = lineChars * maxLines;
  if (chars.length <= lineChars || segmentDeg < 18) {
    const single = chars.length <= maxChars ? candidate : `${sliceChars(candidate, maxChars)}…`;
    return { lines: [single], plain: single };
  }

  const lines = [];
  for (let i = 0; i < maxLines; i += 1) {
    const start = i * lineChars;
    const end = start + lineChars;
    const chunk = chars.slice(start, end).join('');
    if (!chunk) break;
    lines.push(chunk);
  }
  if (chars.length > maxChars && lines.length > 0) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = `${sliceChars(last, Math.max(1, lineChars - 1))}…`;
  }
  return { lines, plain: lines.join('') };
};

const getLabelLayout = (segmentDeg, maxLineLength) => {
  const baseFont = segmentDeg >= 60 ? 12 : segmentDeg >= 45 ? 11 : segmentDeg >= 30 ? 10 : segmentDeg >= 22 ? 9 : 8;
  const textPenalty = Math.max(0, Math.ceil((maxLineLength - 6) / 4));
  const fontSize = clamp(baseFont - textPenalty, 6, 12);

  const radius = segmentDeg >= 55 ? 70 : segmentDeg >= 36 ? 73 : segmentDeg >= 24 ? 76 : 79;
  const arcLength = (Math.PI * 2 * radius) * (segmentDeg / 360);
  const maxWidth = clamp(Math.round(arcLength * 0.82), 30, 96);

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
              placeholder="新增分组"
              className="text-xs bg-white/85 rounded-full px-3 py-1 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
            />
            <button
              type="button"
              className="text-xs font-bold text-white bg-[#ff8acb] px-3 py-1 rounded-full shadow-[0_8px_16px_rgba(255,138,203,0.35)]"
              onClick={async () => {
                const val = newGroup.trim();
                if (!val) return;
                const ok = await onAddGroup(val);
                if (ok !== false) {
                  setNewGroup('');
                }
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
                const segmentColor = segmentColors[idx];
                const labelToken = getDisplayLabelToken(step, opt.label);
                const maxLineLength = Math.max(...labelToken.lines.map((line) => toChars(line).length));
                const layout = getLabelLayout(step, maxLineLength);
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
                      className="wheel-segment-holder"
                      style={{
                        transform: `translateY(-${layout.radius}px)`,
                        width: `${layout.maxWidth}px`,
                        overflow: 'hidden',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span
                        className="wheel-segment-text font-bold text-center"
                        style={{
                          transform: `rotate(-${deg + angle}deg)`,
                          fontSize: `${layout.fontSize}px`,
                          lineHeight: 1.16,
                          color: textTone,
                          maxWidth: `${layout.maxWidth}px`
                        }}
                        title={opt.label}
                      >
                        {labelToken.lines.map((line, lineIdx) => (
                          <span
                            key={`${opt.id}-line-${lineIdx}`}
                            className="block whitespace-nowrap overflow-hidden text-ellipsis"
                          >
                            {line}
                          </span>
                        ))}
                      </span>
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
                <span className="wheel-result-pop text-xs font-bold text-[#ff6fb1] bg-white/90 border border-[#ffd7ea] px-3 py-1 rounded-full shadow-sm">
                  抽到：{result}
                </span>
              )}
            </div>

            {result && (
              <button
                type="button"
                onClick={() => onCreateTask(result)}
                disabled={created}
                className="mt-2 wheel-result-pop text-xs font-bold text-white bg-[#ff8acb] px-4 py-2 rounded-full shadow-[0_10px_20px_rgba(255,138,203,0.32)] disabled:opacity-60"
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
                  onClick={async () => {
                    const val = newOption.trim();
                    if (!val) return;
                    const ok = await onAddOption(val);
                    if (ok !== false) {
                      setNewOption('');
                    }
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
                      onClick={async () => {
                        await onRemoveOption(opt.id);
                      }}
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
                  onClick={async () => {
                    await onClearHistory();
                  }}
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
