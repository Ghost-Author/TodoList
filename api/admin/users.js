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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const users = (data?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at
    }));
    return res.status(200).json({ users, page, perPage });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
