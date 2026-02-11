import { isValidEmail, requireAdmin, writeAdminAudit } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'POST', scope: 'reset-write', limit: 20 });
  if (!auth) return;

  const { supabase, actor } = auth;
  const { email } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email' });
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
      return res.status(500).json({ error: error.message });
    }

    await writeAdminAudit(supabase, actor, {
      action: 'reset_password',
      detail: { email: normalizedEmail, source: 'admin_secret' }
    });

    return res.status(200).json({
      actionLink: data?.properties?.action_link || data?.action_link || null
    });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
