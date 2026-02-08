import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const AdminApp = () => {
  const [secret, setSecret] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadSummary = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '请求失败');
      setData(json);
    } catch (err) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 pb-24">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <div className="card-soft p-8 mt-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#3b2e4a]">后台面板</h1>
          <p className="text-[#7b6f8c] mt-2">请输入管理员密钥以查看统计数据。</p>
          <div className="mt-6 flex gap-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin Secret"
              className="flex-1 text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
            />
            <button onClick={loadSummary} className="btn-soft px-6 rounded-xl font-bold">
              {loading ? '加载中...' : '查看'}
            </button>
          </div>
          {error && <div className="mt-3 text-xs text-[#ff6fb1]">{error}</div>}

          {data && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-[#ff6fb1]">{data.userCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">用户</div>
              </div>
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-[#ff6fb1]">{data.taskCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">任务</div>
              </div>
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-green-500">{data.completedCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已完成</div>
              </div>
              <div className="card-soft-sm p-4 text-center">
                <div className="text-2xl font-black text-[#ff6fb1]">{data.categoryCount}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分类</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
