export const createAdminClient = (secret) => {
  const normalizedSecret = String(secret || '').trim();
  if (!normalizedSecret) {
    throw new Error('请输入 Admin Secret');
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-secret': normalizedSecret
  };

  const request = async (url, options = {}) => {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || '请求失败');
    return json;
  };

  return {
    getSummary: () => request('/api/admin/summary', { method: 'POST' }),
    getUsers: (page = 1, perPage = 20) => request(`/api/admin/users?page=${page}&per_page=${perPage}`, { method: 'GET' }),
    getUser: (id) => request(`/api/admin/user?id=${id}`, { method: 'GET' }),
    getUserTasks: (id) => request(`/api/admin/user_tasks?id=${id}`, { method: 'GET' }),
    getAudit: (page = 1, perPage = 20) => request(`/api/admin/audit?page=${page}&per_page=${perPage}`, { method: 'GET' }),
    banUser: (id, reason) => request('/api/admin/ban', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'ban', reason })
    }),
    unbanUser: (id) => request('/api/admin/ban', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'unban' })
    }),
    resetPassword: (email) => request('/api/admin/reset', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  };
};
