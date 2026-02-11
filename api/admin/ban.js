import { isValidUuid, requireAdmin, writeAdminAudit } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'POST', scope: 'ban-write', limit: 40 });
  if (!auth) return;

  const { supabase, actor } = auth;
  const { id, action, reason } = req.body || {};
  const normalizedAction = String(action || '').trim();
  const normalizedReason = String(reason || '').trim();

  if (!isValidUuid(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  if (normalizedAction !== 'ban' && normalizedAction !== 'unban') {
    return res.status(400).json({ error: 'Invalid action' });
  }
  if (normalizedReason.length > 500) {
    return res.status(400).json({ error: 'Reason too long' });
  }

  const banDuration = normalizedAction === 'ban' ? '100y' : 'none';

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: banDuration
    });
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await writeAdminAudit(supabase, actor, {
      action: normalizedAction === 'ban' ? 'ban_user' : 'unban_user',
      targetUserId: id,
      detail: { reason: normalizedReason || null, source: 'admin_secret' }
    });

    return res.status(200).json({
      id: data?.user?.id,
      ban_expires_at: data?.user?.ban_expires_at || null
    });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
