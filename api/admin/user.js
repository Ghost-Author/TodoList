import { isValidUuid, requireAdmin } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'GET', scope: 'user-read', limit: 120 });
  if (!auth) return;

  const { supabase } = auth;
  const userId = String(req.query.id || '').trim();
  if (!isValidUuid(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

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
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
