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
      <div className="card-soft w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#3b2e4a]">用户详情</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#ff9ccc]"
          >
            关闭
          </button>
        </div>

        {detailLoading && <div className="text-sm text-[#7b6f8c]">加载中...</div>}
        {!detailLoading && !userDetail && <div className="text-sm text-[#7b6f8c]">未获取到用户详情</div>}
        {userDetail && (
          <div className="space-y-3 text-sm text-[#7b6f8c]">
            <div><span className="font-bold text-[#3b2e4a]">邮箱：</span>{userDetail.email || '-'}</div>
            <div><span className="font-bold text-[#3b2e4a]">创建时间：</span>{userDetail.created_at ? new Date(userDetail.created_at).toLocaleString() : '-'}</div>
            <div><span className="font-bold text-[#3b2e4a]">最近登录：</span>{userDetail.last_sign_in_at ? new Date(userDetail.last_sign_in_at).toLocaleString() : '-'}</div>
            <div><span className="font-bold text-[#3b2e4a]">邮箱验证：</span>{userDetail.email_confirmed_at ? '已验证' : '未验证'}</div>
            <div><span className="font-bold text-[#3b2e4a]">禁用状态：</span>{userDetail.ban_expires_at ? `已禁用（到 ${new Date(userDetail.ban_expires_at).toLocaleString()}）` : '正常'}</div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="禁用原因（可选）"
                className="flex-1 text-xs bg-white/80 rounded-xl p-2 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
              />
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

            {resetLink && (
              <div className="mt-2 text-xs">
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
              <div className="card-soft-sm p-3 max-h-48 overflow-auto text-xs">
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
    </div>
  );
};

export default UserDetailModal;
