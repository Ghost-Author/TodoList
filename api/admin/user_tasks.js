import { isValidUuid, requireAdmin, sendJson } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'GET', scope: 'user-tasks-read', limit: 120 });
  if (!auth) return;

  const { supabase, requestId } = auth;
  const userId = String(req.query.id || '').trim();
  if (!isValidUuid(userId)) {
    return sendJson(res, 400, { error: 'Invalid user id' }, requestId);
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, text, completed, created_at, due_date, priority, category, tags')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      return sendJson(res, 500, { error: error.message }, requestId);
    }
    return sendJson(res, 200, { tasks: data || [] }, requestId);
  } catch {
    return sendJson(res, 500, { error: 'Server error' }, requestId);
  }
}
