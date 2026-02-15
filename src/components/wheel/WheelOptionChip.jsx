import React from 'react';
import { X } from 'lucide-react';

const WheelOptionChip = ({ option, weight = 1, onWeightChange, onRemove }) => (
  <span className="text-xs bg-white/90 border border-[#ffe4f2] rounded-full px-2.5 py-1 flex items-center gap-1 text-[#3b2e4a]">
    <span className="max-w-[10rem] truncate" title={option.label}>{option.label}</span>
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#fff0f8] border border-[#ffdcec] text-[#ff6fb1] font-black">
      x{weight}
    </span>
    <button
      type="button"
      onClick={() => onWeightChange?.(option.id, Math.max(1, (weight || 1) - 1))}
      className="text-[#7b6f8c] hover:text-[#ff6fb1] px-1"
      title="降低权重"
    >
      -
    </button>
    <button
      type="button"
      onClick={() => onWeightChange?.(option.id, Math.min(5, (weight || 1) + 1))}
      className="text-[#7b6f8c] hover:text-[#ff6fb1] px-1"
      title="提高权重"
    >
      +
    </button>
    <button
      type="button"
      onClick={async () => {
        await onRemove(option);
      }}
      className="text-[#ff6fb1]"
      title="删除"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default WheelOptionChip;
