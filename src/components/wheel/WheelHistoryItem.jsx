import React from 'react';

const WheelHistoryItem = ({ item, isLast }) => (
  <div className="relative pl-5">
    {!isLast && (
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
);

export default WheelHistoryItem;
