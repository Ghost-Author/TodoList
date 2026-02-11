import { isValidUuid, requireAdmin, sendJson } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'GET', scope: 'user-read', limit: 120 });
  if (!auth) return;

  const { supabase, requestId } = auth;
  const userId = String(req.query.id || '').trim();
  if (!isValidUuid(userId)) {
    return sendJson(res, 400, { error: 'Invalid user id' }, requestId);
  }

  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      return sendJson(res, 500, { error: error.message }, requestId);
    }
    const user = data?.user;
    if (!user) {
      return sendJson(res, 404, { error: 'User not found' }, requestId);
    }
    return sendJson(res, 200, {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      ban_expires_at: user.ban_expires_at,
      app_metadata: user.app_metadata || {},
      user_metadata: user.user_metadata || {}
    }, requestId);
  } catch {
    return sendJson(res, 500, { error: 'Server error' }, requestId);
  }
}
