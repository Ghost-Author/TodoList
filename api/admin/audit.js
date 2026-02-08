import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSecret = process.env.ADMIN_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!adminSecret || req.headers['x-admin-secret'] !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server missing Supabase credentials' });
  }

  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const perPage = Math.min(Math.max(parseInt(req.query.per_page || '20', 10), 1), 100);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data, error } = await supabase
      .from('admin_audit')
      .select('id, admin_email, action, target_user_id, detail, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ logs: data || [], page, perPage });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
