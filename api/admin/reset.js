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

  const { email, adminEmail } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: process.env.PASSWORD_RESET_REDIRECT || undefined
      }
    });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    await supabase.from('admin_audit').insert({
      admin_email: adminEmail || null,
      action: 'reset_password',
      detail: { email }
    });
    return res.status(200).json({
      actionLink: data?.properties?.action_link || data?.action_link || null
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
