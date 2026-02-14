import React from 'react';

const UserDetailModal = ({
  selectedUser,
  onClose,
  detailLoading,
  userDetail,
  banReason,
  setBanReason,
  toggleBan,
  banLoading,
  resetPassword,
  resetLoading,
  resetLink,
  userTasks
}) => {
  if (!selectedUser) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
      <div className="card-soft w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-sm px-4 md:px-6 py-4 border-b border-[#ffe4f2] flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#3b2e4a]">用户详情</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#ff9ccc]"
          >
            关闭
          </button>
        </div>

        <div className="overflow-auto px-4 md:px-6 py-4 space-y-3">
          {detailLoading && <div className="text-sm text-[#7b6f8c]">加载中...</div>}
          {!detailLoading && !userDetail && <div className="text-sm text-[#7b6f8c]">未获取到用户详情</div>}
        {userDetail && (
          <div className="space-y-3 text-sm text-[#7b6f8c]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-white/78 border border-[#ffeaf4] rounded-xl p-3">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">邮箱</div>
                <div className="break-all text-[#3b2e4a] font-semibold">{userDetail.email || '-'}</div>
              </div>
              <div className="bg-white/78 border border-[#ffeaf4] rounded-xl p-3">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">创建时间</div>
                <div>{userDetail.created_at ? new Date(userDetail.created_at).toLocaleString() : '-'}</div>
              </div>
              <div className="bg-white/78 border border-[#ffeaf4] rounded-xl p-3">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">最近登录</div>
                <div>{userDetail.last_sign_in_at ? new Date(userDetail.last_sign_in_at).toLocaleString() : '-'}</div>
              </div>
              <div className="bg-white/78 border border-[#ffeaf4] rounded-xl p-3">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">邮箱验证</div>
                <div className={userDetail.email_confirmed_at ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {userDetail.email_confirmed_at ? '已验证' : '未验证'}
                </div>
              </div>
              <div className="bg-white/78 border border-[#ffeaf4] rounded-xl p-3 md:col-span-2">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">禁用状态</div>
                <div className={userDetail.ban_expires_at ? 'text-red-500 font-semibold' : 'text-[#3b2e4a] font-semibold'}>
                  {userDetail.ban_expires_at ? `已禁用（到 ${new Date(userDetail.ban_expires_at).toLocaleString()}）` : '正常'}
                </div>
              </div>
            </div>

            <div className="bg-white/78 border border-[#ffeaf4] rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-black text-slate-400 uppercase">管理操作</div>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="禁用原因（可选）"
                className="w-full text-xs bg-white/80 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
              />
            </div>

            {resetLink && (
              <div className="mt-2 text-xs bg-white/78 border border-[#ffeaf4] rounded-xl p-3">
                <div className="text-[#3b2e4a] font-bold mb-1 flex items-center justify-between gap-2">
                  <span>重置链接（复制给用户）</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.clipboard?.writeText) return;
                      navigator.clipboard.writeText(resetLink).catch(() => {});
                    }}
                    className="pill-soft px-2 py-1 rounded-full text-[10px]"
                  >
                    复制
                  </button>
                </div>
                <div className="break-all bg-white/80 p-2 rounded-lg border border-[#ffe4f2]">{resetLink}</div>
              </div>
            )}

            <div className="mt-3">
              <div className="text-[#3b2e4a] font-bold mb-2">最近任务（20 条）</div>
              <div className="card-soft-sm p-3 max-h-56 overflow-auto text-xs">
                {userTasks.length === 0 && <div className="text-[#7b6f8c]">暂无任务</div>}
                {userTasks.map((t) => (
                  <div key={t.id} className="py-2 border-b border-[#ffe4f2]">
                    <div className="font-bold text-[#3b2e4a]">{t.text}</div>
                    <div className="text-[#7b6f8c]">
                      {t.completed ? '已完成' : '进行中'} · {t.priority || '-'} · {t.category || '-'}
                      {t.due_date ? ` · 截止 ${t.due_date}` : ''}
                      {t.tags && t.tags.length > 0 ? ` · #${t.tags.join(' #')}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>

        {userDetail && (
          <div className="sticky bottom-0 z-10 bg-white/88 backdrop-blur-sm border-t border-[#ffe4f2] px-4 md:px-6 py-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => toggleBan(userDetail.id, Boolean(userDetail.ban_expires_at))}
                disabled={banLoading || resetLoading}
                className="pill-soft px-3 py-1 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {banLoading ? '处理中...' : (userDetail.ban_expires_at ? '解禁' : '禁用')}
              </button>
              <button
                type="button"
                onClick={() => resetPassword(userDetail.email)}
                disabled={banLoading || resetLoading}
                className="pill-soft px-3 py-1 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? '生成中...' : '重置密码'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
