import React from 'react';
import { X } from 'lucide-react';

const PrivacyModal = ({ show, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="card-soft w-full max-w-2xl p-6 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#3b2e4a]">隐私政策</h3>
          <button onClick={onClose} className="text-[#ff9ccc]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 text-sm text-[#7b6f8c] leading-relaxed">
          <p>云朵清单仅收集账号邮箱与您主动填写的任务内容，用于账号登录与数据同步。</p>
          <p>数据存储于 Supabase（数据库与认证服务），并通过行级权限控制仅允许账号本人访问。</p>
          <p>我们使用 Sentry 进行错误监控，可能收集设备与浏览器信息以帮助定位问题。</p>
          <p>您可以在设置中导出或清空自己的数据。如需注销账号，可联系我们处理。</p>
          <p>如有疑问请联系：liupggg@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;
