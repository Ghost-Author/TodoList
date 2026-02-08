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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const [usersRes, tasksRes, doneRes, catsRes] = await Promise.all([
      supabase.auth.admin.listUsers(),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('completed', true),
      supabase.from('categories').select('id', { count: 'exact', head: true })
    ]);

    if (usersRes.error || tasksRes.error || doneRes.error || catsRes.error) {
      return res.status(500).json({
        error: usersRes.error?.message || tasksRes.error?.message || doneRes.error?.message || catsRes.error?.message
      });
    }

    return res.status(200).json({
      userCount: usersRes.data?.users?.length || 0,
      taskCount: tasksRes.count || 0,
      completedCount: doneRes.count || 0,
      categoryCount: catsRes.count || 0
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
