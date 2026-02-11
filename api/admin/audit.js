import { parsePositiveInt, requireAdmin } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'GET', scope: 'audit-read', limit: 120 });
  if (!auth) return;

  const { supabase } = auth;
  const page = parsePositiveInt(req.query.page, 1, 1, 10_000);
  const perPage = parsePositiveInt(req.query.per_page, 20, 1, 100);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  try {
    const { data, error } = await supabase
      .from('admin_audit')
      .select('id, admin_email, action, target_user_id, detail, created_at')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ logs: data || [], page, perPage });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
