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

  const userId = req.query.id;
  if (!userId) {
    return res.status(400).json({ error: 'Missing user id' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const user = data?.user;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      ban_expires_at: user.ban_expires_at,
      app_metadata: user.app_metadata || {},
      user_metadata: user.user_metadata || {}
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
