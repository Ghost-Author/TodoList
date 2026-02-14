import React from 'react';
import { Sparkles } from 'lucide-react';
import { getDisplayLabel, getLabelLayout, getTextTone } from './renderUtils.js';

const WheelCenterPanel = ({
  options,
  gradient,
  angle,
  spinning,
  segmentColors,
  onSpin,
  result,
  created,
  creating,
  onCreateTask,
  onOpenTasks,
  notice,
  undoOption,
  undoHistory,
  onUndoRemove,
  onUndoHistoryClear
}) => (
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
          onClick={onUndoRemove}
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
          onClick={onUndoHistoryClear}
          className="px-2 py-0.5 rounded-full bg-white/90 border border-[#ffe4f2] text-[#ff6fb1] font-bold shrink-0"
        >
          撤销
        </button>
      </div>
    )}
  </div>
);

export default WheelCenterPanel;
