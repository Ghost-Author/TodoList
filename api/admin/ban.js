import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSecret = process.env.ADMIN_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!adminSecret || req.headers['x-admin-secret'] !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server missing Supabase credentials' });
  }

  const { id, action, reason, adminEmail } = req.body || {};
  if (!id || !action) {
    return res.status(400).json({ error: 'Missing id or action' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const banDuration = action === 'ban' ? '100y' : '0h';

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: banDuration
    });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    await supabase.from('admin_audit').insert({
      admin_email: adminEmail || null,
      action: action === 'ban' ? 'ban_user' : 'unban_user',
      target_user_id: id,
      detail: { reason: reason || null }
    });
    return res.status(200).json({
      id: data?.user?.id,
      ban_expires_at: data?.user?.ban_expires_at || null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
