import { isValidUuid, requireAdmin } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'GET', scope: 'user-tasks-read', limit: 120 });
  if (!auth) return;

  const { supabase } = auth;
  const userId = String(req.query.id || '').trim();
  if (!isValidUuid(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, text, completed, created_at, due_date, priority, category, tags')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ tasks: data || [] });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
