import { isValidUuid, requireAdmin, sendJson, writeAdminAudit } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'POST', scope: 'ban-write', limit: 40 });
  if (!auth) return;

  const { supabase, actor, requestId } = auth;
  const { id, action, reason } = req.body || {};
  const normalizedAction = String(action || '').trim();
  const normalizedReason = String(reason || '').trim();

  if (!isValidUuid(id)) {
    return sendJson(res, 400, { error: 'Invalid user id' }, requestId);
  }
  if (normalizedAction !== 'ban' && normalizedAction !== 'unban') {
    return sendJson(res, 400, { error: 'Invalid action' }, requestId);
  }
  if (normalizedReason.length > 500) {
    return sendJson(res, 400, { error: 'Reason too long' }, requestId);
  }

  const banDuration = normalizedAction === 'ban' ? '100y' : 'none';

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: banDuration
    });
    if (error) {
      return sendJson(res, 500, { error: error.message }, requestId);
    }

    await writeAdminAudit(supabase, actor, {
      action: normalizedAction === 'ban' ? 'ban_user' : 'unban_user',
      targetUserId: id,
      detail: { reason: normalizedReason || null, source: 'admin_secret' }
    });

    return sendJson(res, 200, {
      id: data?.user?.id,
      ban_expires_at: data?.user?.ban_expires_at || null
    }, requestId);
  } catch {
    return sendJson(res, 500, { error: 'Server error' }, requestId);
  }
}
