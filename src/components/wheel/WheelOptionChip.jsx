import React from 'react';
import { X } from 'lucide-react';

const WheelOptionChip = ({ option, onRemove }) => (
  <span className="text-xs bg-white/90 border border-[#ffe4f2] rounded-full px-3 py-1 flex items-center gap-1 text-[#3b2e4a]">
    {option.label}
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
