import React from 'react';
import WheelHistoryItem from './WheelHistoryItem.jsx';

const WheelHistoryDayGroup = ({ dateLabel, items }) => (
  <section>
    <div className="sticky top-0 z-10 py-1.5 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.75))] backdrop-blur-sm">
      <span className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.12em] text-[#7b6f8c] bg-white/90 border border-[#ffe4f2] rounded-full px-2 py-0.5">
        {dateLabel}
      </span>
    </div>
    <div className="space-y-2 pt-1">
      {items.map((item, idx) => (
        <WheelHistoryItem key={item.id} item={item} isLast={idx === items.length - 1} />
      ))}
    </div>
  </section>
);

export default WheelHistoryDayGroup;
