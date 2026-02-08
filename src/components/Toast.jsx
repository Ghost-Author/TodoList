import React from 'react';

const Toast = ({ toast, onAction }) => {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 border border-[#ffe4f2] px-4 py-2 rounded-full text-xs text-[#3b2e4a] shadow-sm flex items-center gap-3">
      <span>{toast.message}</span>
      {toast.action && (
        <button type="button" onClick={onAction} className="text-[#ff6fb1] font-bold">
          {toast.action}
        </button>
      )}
    </div>
  );
};

export default Toast;
