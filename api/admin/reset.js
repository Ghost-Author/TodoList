import { isValidEmail, requireAdmin, sendJson, writeAdminAudit } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'POST', scope: 'reset-write', limit: 20 });
  if (!auth) return;

  const { supabase, actor, requestId } = auth;
  const { email } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return sendJson(res, 400, { error: 'Invalid email' }, requestId);
  }

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: process.env.PASSWORD_RESET_REDIRECT || undefined
      }
    });
    if (error) {
      return sendJson(res, 500, { error: error.message }, requestId);
    }

    await writeAdminAudit(supabase, actor, {
      action: 'reset_password',
      detail: { email: normalizedEmail, source: 'admin_secret' }
    });

    return sendJson(res, 200, {
      actionLink: data?.properties?.action_link || data?.action_link || null
    }, requestId);
  } catch {
    return sendJson(res, 500, { error: 'Server error' }, requestId);
  }
}
