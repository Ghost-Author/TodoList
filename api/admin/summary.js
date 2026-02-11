import { countAllUsers, requireAdmin } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'POST', scope: 'summary-read', limit: 90 });
  if (!auth) return;

  const { supabase } = auth;

  try {
    const today = new Date().toISOString().slice(0, 10);
    const [usersRes, tasksRes, doneRes, catsRes, overdueRes, highRes, activeRes] = await Promise.all([
      countAllUsers(supabase),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('completed', true),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).lt('due_date', today).eq('completed', false),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('priority', 'high').eq('completed', false),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('completed', false)
    ]);

    if (
      usersRes.error
      || tasksRes.error
      || doneRes.error
      || catsRes.error
      || overdueRes.error
      || highRes.error
      || activeRes.error
    ) {
      return res.status(500).json({
        error: usersRes.error?.message
          || tasksRes.error?.message
          || doneRes.error?.message
          || catsRes.error?.message
          || overdueRes.error?.message
          || highRes.error?.message
          || activeRes.error?.message
      });
    }

    return res.status(200).json({
      userCount: usersRes.count || 0,
      taskCount: tasksRes.count || 0,
      completedCount: doneRes.count || 0,
      categoryCount: catsRes.count || 0,
      overdueCount: overdueRes.count || 0,
      highPriorityCount: highRes.count || 0,
      activeCount: activeRes.count || 0
    });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}
