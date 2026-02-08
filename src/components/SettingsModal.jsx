import React from 'react';
import { X } from 'lucide-react';

const SettingsModal = ({
  show,
  onClose,
  newPassword,
  setNewPassword,
  updatePassword,
  exportData,
  clearAllData,
  openPrivacy
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="card-soft w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#3b2e4a]">设置</h3>
          <button onClick={onClose} className="text-[#ff9ccc]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <label className="text-xs text-[#7b6f8c]">修改密码</label>
            <div className="mt-2 flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新密码"
                className="flex-1 bg-white/80 rounded-xl p-2.5 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
              />
              <button type="button" onClick={updatePassword} className="btn-soft px-4 rounded-xl font-bold">
                更新
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={exportData} className="pill-soft px-4 py-2 rounded-xl font-bold">
              导出数据
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('确定要清空所有数据吗？此操作不可恢复。')) {
                  clearAllData();
                }
              }}
              className="px-4 py-2 rounded-xl font-bold text-white bg-[#ff7aa8]"
            >
              清空数据
            </button>
          </div>
          <button
            type="button"
            onClick={openPrivacy}
            className="text-[#7b6f8c] hover:text-[#ff6fb1] underline"
          >
            查看隐私政策
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
