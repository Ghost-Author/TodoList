import { parsePositiveInt, requireAdmin, sendJson } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'GET', scope: 'users-read', limit: 120 });
  if (!auth) return;

  const { supabase, requestId } = auth;
  const page = parsePositiveInt(req.query.page, 1, 1, 10_000);
  const perPage = parsePositiveInt(req.query.per_page, 20, 1, 100);

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });
    if (error) {
      return sendJson(res, 500, { error: error.message }, requestId);
    }
    const users = (data?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at
    }));
    return sendJson(res, 200, { users, page, perPage }, requestId);
  } catch {
    return sendJson(res, 500, { error: 'Server error' }, requestId);
  }
}
